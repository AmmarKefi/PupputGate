import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { api } from '@/lib/api';
import { assetUrl } from '@/lib/assets';
import { formatMillimes, parseDinarsToMillimes } from '@/lib/format';
import { categoryIcon } from '@/lib/catalogIcons';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { haptics } from '@/lib/haptics';
import {
  pickImage,
  uploadCoverImage,
  updateCoverUrl,
  resetCoverToDefault,
  uploadProductImage,
  type PickedImage,
} from '@/lib/upload';
import type { BusinessDetail, ProductItem, ServiceItem, StockStatus } from '@/types';

interface Props {
  business: BusinessDetail;
  onUpdated: () => void;
}

const STOCK_OPTIONS: { id: StockStatus; labelFr: string; labelEn: string; labelAr: string }[] = [
  { id: 'IN_STOCK', labelFr: 'En stock', labelEn: 'In stock', labelAr: 'متوفر' },
  { id: 'UNIQUE_PIECE', labelFr: 'Pièce unique', labelEn: 'Unique piece', labelAr: 'قطعة فريدة' },
  { id: 'MADE_TO_ORDER', labelFr: 'Sur commande', labelEn: 'Made to order', labelAr: 'عند الطلب' },
  { id: 'OUT_OF_STOCK', labelFr: 'Épuisé', labelEn: 'Out of stock', labelAr: 'نفذ' },
];

const COMMON_DURATIONS = [15, 30, 45, 60, 90, 120];

const OFFER_BADGES = [
  'PROMO -20%',
  'PROMO -30%',
  'BON PLAN',
  'OFFRE DU JOUR',
  'VENTE FLASH',
  'PACK DUO',
  'REMISE',
  'CADEAU OFFERT',
];

function parseOffer(fullName: string) {
  const match = fullName.match(/^\[OFFRE:\s*([^\]]+)\]\s*(.*)$/);
  if (!match) return { badge: 'PROMO', title: fullName };
  return { badge: match[1], title: match[2] };
}

export function MerchantStorefront({ business: b, onUpdated }: Props) {
  const { t, locale, isRTL } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';

  // Banner editing state
  const [bannerMode, setBannerMode] = useState<'idle' | 'url'>('idle');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [bannerBusy, setBannerBusy] = useState(false);

  // Offers state
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerBadge, setOfferBadge] = useState('PROMO -20%');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerImage, setOfferImage] = useState<PickedImage | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerErr, setOfferErr] = useState<string | null>(null);

  // New Booking Service state
  const [showAddService, setShowAddService] = useState(false);
  const [servName, setServName] = useState('');
  const [servPrice, setServPrice] = useState('');
  const [servDuration, setServDuration] = useState(30);
  const [servDesc, setServDesc] = useState('');
  const [servBusy, setServBusy] = useState(false);
  const [servErr, setServErr] = useState<string | null>(null);

  // New Product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodStock, setProdStock] = useState<StockStatus>('IN_STOCK');
  const [prodImage, setProdImage] = useState<PickedImage | null>(null);
  const [prodBusy, setProdBusy] = useState(false);
  const [prodErr, setProdErr] = useState<string | null>(null);

  // Deletion tracking
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Categorize products into offers vs regular catalog
  const offers = b.products.filter((p) => p.name.startsWith('[OFFRE'));
  const catalogProducts = b.products.filter((p) => !p.name.startsWith('[OFFRE'));

  // --- Banner Actions ---
  async function handlePickBanner() {
    try {
      const picked = await pickImage([16, 9]);
      if (!picked) return;
      setBannerBusy(true);
      await uploadCoverImage(b.id, picked);
      haptics.success();
      onUpdated();
    } catch {
      haptics.error();
      Alert.alert(t('error.generic'), 'Impossible de téléverser cette image.');
    } finally {
      setBannerBusy(false);
    }
  }

  async function handleSaveBannerUrl() {
    const trimmed = bannerUrlInput.trim();
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      Alert.alert(t('error.generic'), 'Veuillez entrer une URL valide commençant par https://');
      return;
    }
    setBannerBusy(true);
    try {
      await updateCoverUrl(b.id, trimmed);
      haptics.success();
      setBannerUrlInput('');
      setBannerMode('idle');
      onUpdated();
    } catch {
      haptics.error();
      Alert.alert(t('error.generic'), 'Impossible d’enregistrer le lien de la bannière.');
    } finally {
      setBannerBusy(false);
    }
  }

  async function handleResetBanner() {
    setBannerBusy(true);
    try {
      await resetCoverToDefault(b.id);
      haptics.success();
      onUpdated();
    } catch {
      haptics.error();
      Alert.alert(t('error.generic'), 'Impossible de rétablir la photo par défaut.');
    } finally {
      setBannerBusy(false);
    }
  }

  // --- Offer Actions ---
  async function handlePickOfferImage() {
    const img = await pickImage([4, 3]);
    if (img) setOfferImage(img);
  }

  async function handleAddOffer() {
    if (!offerTitle.trim()) {
      setOfferErr("Le titre de l'offre est requis");
      return;
    }
    const priceMillimes = parseDinarsToMillimes(offerPrice || '0') ?? 0;
    setOfferErr(null);
    setOfferBusy(true);
    try {
      const fullOfferName = `[OFFRE: ${offerBadge}] ${offerTitle.trim()}`;
      const res = await api.post<{ product: { id: string } }>(`/merchant/businesses/${b.id}/products`, {
        name: fullOfferName,
        priceMillimes,
        description: offerDesc.trim() || undefined,
        stockStatus: 'IN_STOCK',
      });

      if (offerImage && res.product?.id) {
        await uploadProductImage(res.product.id, offerImage);
      }

      haptics.success();
      setOfferTitle('');
      setOfferPrice('');
      setOfferDesc('');
      setOfferImage(null);
      setShowAddOffer(false);
      onUpdated();
    } catch {
      haptics.error();
      setOfferErr("Erreur lors de l'ajout de l'offre");
    } finally {
      setOfferBusy(false);
    }
  }

  // --- Service Actions ---
  async function handleAddService() {
    if (!servName.trim()) {
      setServErr('Le nom de la prestation est requis');
      return;
    }
    const priceMillimes = parseDinarsToMillimes(servPrice || '0') ?? 0;

    setServErr(null);
    setServBusy(true);
    try {
      await api.post(`/merchant/businesses/${b.id}/services`, {
        name: servName.trim(),
        durationMin: servDuration,
        priceMillimes,
        description: servDesc.trim() || undefined,
      });

      haptics.success();
      setServName('');
      setServPrice('');
      setServDesc('');
      setServDuration(30);
      setShowAddService(false);
      onUpdated();
    } catch {
      haptics.error();
      setServErr('Erreur lors de l’ajout du service');
    } finally {
      setServBusy(false);
    }
  }

  async function handleDeleteService(id: string) {
    setDeletingId(id);
    try {
      await api.del(`/merchant/services/${id}`);
      haptics.success();
      onUpdated();
    } catch {
      haptics.error();
    } finally {
      setDeletingId(null);
    }
  }

  // --- Product Actions ---
  async function handlePickProductImage() {
    const img = await pickImage([1, 1]);
    if (img) setProdImage(img);
  }

  async function handleAddProduct() {
    if (!prodName.trim()) {
      setProdErr('Le nom du produit est requis');
      return;
    }
    const priceMillimes = parseDinarsToMillimes(prodPrice);
    if (priceMillimes == null || priceMillimes < 0) {
      setProdErr('Veuillez entrer un prix valide en DT');
      return;
    }

    setProdErr(null);
    setProdBusy(true);
    try {
      const res = await api.post<{ product: { id: string } }>(`/merchant/businesses/${b.id}/products`, {
        name: prodName.trim(),
        priceMillimes,
        description: prodDesc.trim() || undefined,
        stockStatus: prodStock,
      });

      if (prodImage && res.product?.id) {
        await uploadProductImage(res.product.id, prodImage);
      }

      haptics.success();
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdImage(null);
      setProdStock('IN_STOCK');
      setShowAddProduct(false);
      onUpdated();
    } catch {
      haptics.error();
      setProdErr('Erreur lors de l’ajout du produit');
    } finally {
      setProdBusy(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    setDeletingId(id);
    try {
      await api.del(`/merchant/products/${id}`);
      haptics.success();
      onUpdated();
    } catch {
      haptics.error();
    } finally {
      setDeletingId(null);
    }
  }

  const coverUri = assetUrl(b.coverImage);

  return (
    <View style={styles.container}>
      {/* 1. BANNER SECTION */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIcon}>
          <Ionicons name="image-outline" size={18} color={palette.forest} />
        </View>
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 16 }}>
          Bannière de votre commerce
        </Text>
      </View>

      <Card padded={false} style={styles.bannerCard}>
        <View style={styles.bannerPreviewWrap}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.bannerImage} contentFit="cover" />
          ) : categoryPhoto(b.categorySlug) ? (
            <Image source={categoryPhoto(b.categorySlug)!} style={styles.bannerImage} contentFit="cover" />
          ) : (
            <CoverPlaceholder name={b.name} mode={b.primaryMode} icon={categoryIcon(b.categorySlug)} height={165} />
          )}

          <View style={styles.bannerOverlay}>
            <Text variant="eyebrow" color={palette.white} style={{ fontWeight: '800' }}>
              {coverUri ? 'Bannière personnalisée active' : 'Bannière par défaut assignée'}
            </Text>
          </View>
        </View>

        <View style={styles.bannerActions}>
          {bannerMode === 'idle' ? (
            <View style={{ gap: spacing.sm }}>
              <View style={styles.bannerBtnRow}>
                <Button
                  label={coverUri ? 'Changer la photo' : 'Choisir une photo'}
                  icon="images-outline"
                  loading={bannerBusy}
                  onPress={handlePickBanner}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Par lien URL"
                  icon="link-outline"
                  variant="secondary"
                  onPress={() => setBannerMode('url')}
                  style={{ flex: 1 }}
                />
              </View>
              {coverUri ? (
                <Button
                  label="Rétablir la photo par défaut"
                  variant="ghost"
                  loading={bannerBusy}
                  onPress={handleResetBanner}
                  style={{ marginTop: 2 }}
                />
              ) : null}
            </View>
          ) : (
            <Animated.View entering={FadeInDown.duration(220)} style={styles.urlForm}>
              <Input
                label="Lien web de l'image (HTTPS)"
                placeholder="https://images.unsplash.com/..."
                value={bannerUrlInput}
                onChangeText={setBannerUrlInput}
                autoCapitalize="none"
                keyboardType="url"
              />
              <View style={styles.bannerBtnRow}>
                <Button
                  label="Enregistrer l'image"
                  loading={bannerBusy}
                  onPress={handleSaveBannerUrl}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Annuler"
                  variant="ghost"
                  onPress={() => {
                    setBannerMode('idle');
                    setBannerUrlInput('');
                  }}
                  style={{ flex: 0.6 }}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </Card>

      {/* 2. OFFERS & PROMOTIONS SECTION */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <View style={[styles.sectionIcon, { backgroundColor: '#FFF2EA' }]}>
          <Ionicons name="sparkles" size={18} color="#FF6A3D" />
        </View>
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 16 }}>
          Offres & Promotions ({offers.length})
        </Text>
        <Pressable
          onPress={() => {
            haptics.tap();
            setShowAddOffer(!showAddOffer);
          }}
          style={[styles.addBtn, { backgroundColor: '#FFF0EA' }]}
          accessibilityRole="button"
        >
          <Ionicons name={showAddOffer ? 'close' : 'add'} size={18} color="#FF6A3D" />
          <Text variant="meta" color="#FF6A3D" style={{ fontWeight: '800', marginStart: 4 }}>
            {showAddOffer ? 'Fermer' : 'Ajouter'}
          </Text>
        </Pressable>
      </View>

      {showAddOffer ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card style={[styles.formCard, { borderColor: '#FFC8B4' }]}>
            <Text variant="bodyStrong" style={{ marginBottom: spacing.sm, fontSize: 16 }}>
              Nouvelle offre promotionnelle
            </Text>

            <View style={{ marginBottom: spacing.md }}>
              <Text variant="meta" style={{ marginBottom: 6, fontWeight: '700' }}>
                Badge ou type de réduction
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {OFFER_BADGES.map((badge) => {
                  const sel = offerBadge === badge;
                  return (
                    <Pressable
                      key={badge}
                      onPress={() => {
                        haptics.selection();
                        setOfferBadge(badge);
                      }}
                      style={[styles.pillChip, sel && { backgroundColor: '#FF6A3D', borderColor: '#FF6A3D' }]}
                    >
                      <Text variant="meta" color={sel ? palette.white : palette.ink} style={{ fontWeight: '700' }}>
                        {badge}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Input
              label="Titre de l'offre *"
              placeholder="ex: Pack Soin & Brushing, Deuxième article à moitié prix..."
              value={offerTitle}
              onChangeText={setOfferTitle}
            />

            <Input
              label="Prix promotionnel en Dinars (DT)"
              placeholder="ex: 19.000 (ou 0 si remise générale)"
              keyboardType="decimal-pad"
              value={offerPrice}
              onChangeText={setOfferPrice}
            />

            {/* Offer photo picker */}
            <View style={{ marginBottom: spacing.md }}>
              <Text variant="meta" style={{ marginBottom: 6, fontWeight: '700' }}>
                Visuel de l'offre (optionnel)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {offerImage ? (
                  <Image source={{ uri: offerImage.uri }} style={styles.prodImagePreview} contentFit="cover" />
                ) : (
                  <View style={styles.prodImagePlaceholder}>
                    <Ionicons name="sparkles-outline" size={24} color={palette.mutedText} />
                  </View>
                )}
                <Button
                  label={offerImage ? 'Changer le visuel' : 'Ajouter un visuel'}
                  variant="secondary"
                  icon="camera-outline"
                  onPress={handlePickOfferImage}
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            <Input
              label="Conditions ou détails (optionnel)"
              placeholder="ex: Valable ce week-end uniquement..."
              value={offerDesc}
              onChangeText={setOfferDesc}
              multiline
            />

            {offerErr ? (
              <Text variant="meta" color={palette.errorRed} style={{ marginBottom: spacing.sm }}>
                {offerErr}
              </Text>
            ) : null}

            <Button
              label="Publier cette offre"
              accent="#FF6A3D"
              loading={offerBusy}
              onPress={handleAddOffer}
              style={{ marginTop: spacing.xs }}
            />
          </Card>
        </Animated.View>
      ) : null}

      {offers.length === 0 && !showAddOffer ? (
        <Card style={styles.emptyCard}>
          <Text variant="meta" muted center>
            Aucune offre active. Cliquez sur "Ajouter" pour publier une promotion ou un bon plan attractif.
          </Text>
        </Card>
      ) : (
        offers.map((o: ProductItem) => {
          const parsed = parseOffer(o.name);
          const imgUrl = assetUrl(o.image);
          return (
            <Card key={o.id} style={styles.offerCard}>
              {imgUrl ? (
                <Image source={{ uri: imgUrl }} style={styles.offerThumb} contentFit="cover" />
              ) : (
                <View style={[styles.offerThumb, { backgroundColor: '#FFF0EA' }]}>
                  <Ionicons name="sparkles" size={22} color="#FF6A3D" />
                </View>
              )}
              <View style={styles.itemBody}>
                <View style={styles.offerBadgeTag}>
                  <Text variant="eyebrow" color="#FF6A3D" style={{ fontWeight: '800' }}>
                    {parsed.badge}
                  </Text>
                </View>
                <Text variant="bodyStrong" style={{ fontSize: 15, marginTop: 4 }}>
                  {parsed.title}
                </Text>
                {o.description ? (
                  <Text variant="meta" muted numberOfLines={2} style={{ marginTop: 2, fontSize: 12 }}>
                    {o.description}
                  </Text>
                ) : null}
                {o.priceMillimes > 0 ? (
                  <Text variant="meta" color="#FF6A3D" style={{ marginTop: 4, fontWeight: '800' }}>
                    {formatMillimes(o.priceMillimes, loc)}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => handleDeleteProduct(o.id)}
                disabled={deletingId === o.id}
                hitSlop={8}
                style={styles.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel="Supprimer l'offre"
              >
                <Ionicons name="trash-outline" size={19} color={palette.errorRed} />
              </Pressable>
            </Card>
          );
        })
      )}

      {/* 3. SERVICES & BOOKINGS SECTION */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <View style={[styles.sectionIcon, { backgroundColor: `${modeAccent.APPOINTMENT}18` }]}>
          <Ionicons name="calendar-outline" size={18} color={modeAccent.APPOINTMENT} />
        </View>
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 16 }}>
          Services & Réservations ({b.services.length})
        </Text>
        <Pressable
          onPress={() => {
            haptics.tap();
            setShowAddService(!showAddService);
          }}
          style={styles.addBtn}
          accessibilityRole="button"
        >
          <Ionicons name={showAddService ? 'close' : 'add'} size={18} color={palette.forest} />
          <Text variant="meta" color={palette.forest} style={{ fontWeight: '800', marginStart: 4 }}>
            {showAddService ? 'Fermer' : 'Ajouter'}
          </Text>
        </Pressable>
      </View>

      {showAddService ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card style={styles.formCard}>
            <Text variant="bodyStrong" style={{ marginBottom: spacing.md, fontSize: 16 }}>
              Nouveau service de réservation
            </Text>
            <Input
              label="Nom de la prestation *"
              placeholder="ex: Coupe & Coiffage, Consultation..."
              value={servName}
              onChangeText={setServName}
            />

            <View style={{ marginBottom: spacing.md }}>
              <Text variant="meta" style={{ marginBottom: 8, fontWeight: '700' }}>
                Durée du rendez-vous
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 }}
              >
                {COMMON_DURATIONS.map((d) => {
                  const sel = servDuration === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        haptics.selection();
                        setServDuration(d);
                      }}
                      style={[styles.pillChip, sel && styles.pillChipActive]}
                    >
                      <Text variant="meta" color={sel ? palette.white : palette.ink} style={{ fontWeight: '700' }}>
                        {d} min
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Input
              label="Prix en Dinars (DT)"
              placeholder="ex: 25.000 (ou 0 si gratuit)"
              keyboardType="decimal-pad"
              value={servPrice}
              onChangeText={setServPrice}
            />

            <Input
              label="Description (optionnel)"
              placeholder="Détails du service pour le client..."
              value={servDesc}
              onChangeText={setServDesc}
              multiline
            />

            {servErr ? (
              <Text variant="meta" color={palette.errorRed} style={{ marginBottom: spacing.sm }}>
                {servErr}
              </Text>
            ) : null}

            <Button
              label="Enregistrer la prestation"
              accent={modeAccent.APPOINTMENT}
              loading={servBusy}
              onPress={handleAddService}
              style={{ marginTop: spacing.xs }}
            />
          </Card>
        </Animated.View>
      ) : null}

      {b.services.length === 0 && !showAddService ? (
        <Card style={styles.emptyCard}>
          <Text variant="meta" muted center>
            Aucun service pour le moment. Cliquez sur "Ajouter" pour permettre aux clients de réserver directement en ligne.
          </Text>
        </Card>
      ) : (
        b.services.map((s: ServiceItem) => (
          <Card key={s.id} style={styles.bookingCard}>
            <View style={styles.bookingIconWrap}>
              <Ionicons name="calendar" size={20} color={modeAccent.APPOINTMENT} />
            </View>
            <View style={styles.itemBody}>
              <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                {s.name}
              </Text>
              {s.description ? (
                <Text variant="meta" muted numberOfLines={2} style={{ marginTop: 2, fontSize: 12.5 }}>
                  {s.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <View style={styles.bookingChip}>
                  <Ionicons name="time-outline" size={13} color={modeAccent.APPOINTMENT} />
                  <Text variant="meta" color={modeAccent.APPOINTMENT} style={{ fontWeight: '700', marginStart: 4, fontSize: 12 }}>
                    {s.durationMin} min
                  </Text>
                </View>
                <View style={[styles.bookingChip, { backgroundColor: `${palette.forest}12` }]}>
                  <Ionicons name="pricetag-outline" size={12} color={palette.forest} />
                  <Text variant="meta" color={palette.forest} style={{ fontWeight: '800', marginStart: 4, fontSize: 12 }}>
                    {formatMillimes(s.priceMillimes, loc)}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => handleDeleteService(s.id)}
              disabled={deletingId === s.id}
              hitSlop={8}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel="Supprimer le service"
            >
              <Ionicons name="trash-outline" size={19} color={palette.errorRed} />
            </Pressable>
          </Card>
        ))
      )}

      {/* 4. PRODUCTS & ARTICLES SECTION */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <View style={[styles.sectionIcon, { backgroundColor: `${modeAccent.ORDER}18` }]}>
          <Ionicons name="bag-handle-outline" size={18} color={modeAccent.ORDER} />
        </View>
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 16 }}>
          Articles & Produits du catalogue ({catalogProducts.length})
        </Text>
        <Pressable
          onPress={() => {
            haptics.tap();
            setShowAddProduct(!showAddProduct);
          }}
          style={styles.addBtn}
          accessibilityRole="button"
        >
          <Ionicons name={showAddProduct ? 'close' : 'add'} size={18} color={palette.forest} />
          <Text variant="meta" color={palette.forest} style={{ fontWeight: '800', marginStart: 4 }}>
            {showAddProduct ? 'Fermer' : 'Ajouter'}
          </Text>
        </Pressable>
      </View>

      {showAddProduct ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card style={styles.formCard}>
            <Text variant="bodyStrong" style={{ marginBottom: spacing.sm, fontSize: 16 }}>
              Nouvel article au catalogue
            </Text>
            <Input
              label="Nom du produit *"
              placeholder="ex: Huile d'olive 1L, Robe en lin..."
              value={prodName}
              onChangeText={setProdName}
            />

            <Input
              label="Prix en Dinars (DT) *"
              placeholder="ex: 35.000"
              keyboardType="decimal-pad"
              value={prodPrice}
              onChangeText={setProdPrice}
            />

            {/* Photo picker */}
            <View style={{ marginBottom: spacing.md }}>
              <Text variant="meta" style={{ marginBottom: 6, fontWeight: '700' }}>
                Photo du produit (optionnel)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {prodImage ? (
                  <Image source={{ uri: prodImage.uri }} style={styles.prodImagePreview} contentFit="cover" />
                ) : (
                  <View style={styles.prodImagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color={palette.mutedText} />
                  </View>
                )}
                <Button
                  label={prodImage ? 'Changer la photo' : 'Choisir une photo'}
                  variant="secondary"
                  icon="camera-outline"
                  onPress={handlePickProductImage}
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            {/* Stock status pills */}
            <View style={{ marginBottom: spacing.md }}>
              <Text variant="meta" style={{ marginBottom: 6, fontWeight: '700' }}>
                Disponibilité / Stock
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STOCK_OPTIONS.map((st) => {
                  const sel = prodStock === st.id;
                  const label = loc === 'ar' ? st.labelAr : loc === 'en' ? st.labelEn : st.labelFr;
                  return (
                    <Pressable
                      key={st.id}
                      onPress={() => {
                        haptics.selection();
                        setProdStock(st.id);
                      }}
                      style={[styles.pillChip, sel && styles.pillChipActive]}
                    >
                      <Text variant="meta" color={sel ? palette.white : palette.ink} style={{ fontWeight: '700' }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input
              label="Description (optionnel)"
              placeholder="Détails, composition ou dimensions..."
              value={prodDesc}
              onChangeText={setProdDesc}
              multiline
            />

            {prodErr ? (
              <Text variant="meta" color={palette.errorRed} style={{ marginBottom: spacing.sm }}>
                {prodErr}
              </Text>
            ) : null}

            <Button
              label="Ajouter l'article"
              accent={modeAccent.ORDER}
              loading={prodBusy}
              onPress={handleAddProduct}
              style={{ marginTop: spacing.xs }}
            />
          </Card>
        </Animated.View>
      ) : null}

      {catalogProducts.length === 0 && !showAddProduct ? (
        <Card style={styles.emptyCard}>
          <Text variant="meta" muted center>
            Aucun article dans votre catalogue. Cliquez sur "Ajouter" pour publier votre premier article en ligne.
          </Text>
        </Card>
      ) : (
        catalogProducts.map((p: ProductItem) => {
          const imgUrl = assetUrl(p.image);
          return (
            <Card key={p.id} style={styles.productCard}>
              {imgUrl ? (
                <Image source={{ uri: imgUrl }} style={styles.itemThumb} contentFit="cover" />
              ) : (
                <View style={[styles.itemThumb, { backgroundColor: `${modeAccent.ORDER}14` }]}>
                  <Ionicons name="bag-handle-outline" size={20} color={modeAccent.ORDER} />
                </View>
              )}
              <View style={styles.itemBody}>
                <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                  {p.name}
                </Text>
                {p.description ? (
                  <Text variant="meta" muted numberOfLines={1} style={{ marginTop: 2, fontSize: 12.5 }}>
                    {p.description}
                  </Text>
                ) : null}
                <Text variant="meta" color={modeAccent.ORDER} style={{ marginTop: 4, fontWeight: '800' }}>
                  {formatMillimes(p.priceMillimes, loc)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeleteProduct(p.id)}
                disabled={deletingId === p.id}
                hitSlop={8}
                style={styles.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel="Supprimer le produit"
              >
                <Ionicons name="trash-outline" size={19} color={palette.errorRed} />
              </Pressable>
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md, paddingBottom: spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${palette.forest}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: `${palette.forest}14`,
  },
  bannerCard: {
    overflow: 'hidden',
    marginBottom: spacing.md,
    marginHorizontal: 1,
    borderRadius: radius.card,
  },
  bannerPreviewWrap: { width: '100%', height: 165, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', backgroundColor: palette.surfaceAlt },
  bannerOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  bannerActions: { padding: spacing.md },
  bannerBtnRow: { flexDirection: 'row', gap: spacing.sm },
  urlForm: { gap: spacing.sm },
  formCard: {
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: `${palette.forest}30`,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: spacing.lg + 2,
    marginHorizontal: 1,
    borderRadius: radius.card,
  },
  pillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillChipActive: {
    backgroundColor: palette.forest,
    borderColor: palette.forest,
  },
  emptyCard: { paddingVertical: spacing.lg, marginBottom: spacing.md, marginHorizontal: 1 },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg + 4,
    marginHorizontal: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(0,128,120,0.14)',
    shadowColor: '#003F3A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bookingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${modeAccent.APPOINTMENT}16`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg + 4,
    marginHorizontal: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,106,61,0.22)',
    shadowColor: '#FF6A3D',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  offerThumb: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: palette.surfaceAlt,
  },
  offerBadgeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: '#FFF0EA',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg + 4,
    marginHorizontal: 1,
    borderRadius: radius.card,
    shadowColor: '#003F3A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: radius.card,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemBody: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  bookingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: `${modeAccent.APPOINTMENT}12`,
  },
  prodImagePreview: {
    width: 58,
    height: 58,
    borderRadius: radius.card,
    backgroundColor: palette.surfaceAlt,
  },
  prodImagePlaceholder: {
    width: 58,
    height: 58,
    borderRadius: radius.card,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: spacing.xs,
  },
});
