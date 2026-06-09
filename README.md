# Auro Novel API

Yazarların eserlerini yayınlayıp okuyucularından gelir elde edebildiği bir REST API. Modern web uygulamalarında hikaye, kitap ve uzun formatlu içerik yönetimi için gerekli tüm altyapıyı sağlar.

## Özellikler

- **İçerik Yönetimi** — Novellar, bölümler, ciltler ve içerik hiyerarşisi
- **Yorum & Etkileşim** — Okuyucu yorumları, yanıtlar ve beğeniler
- **Kullanıcı Sistemi** — Kimlik doğrulama, email doğrulaması, profil yönetimi
- **Kitaplık** — Okuyucuların devam ettiği hikayeler ve tercih ettikleri içerik
- **İstatistikler** — Bölüm görüntüleme sayıları ve trend analizi
- **Kategori & Etiketler** — İçerik düzenleme ve keşif
- **Dosya Yönetme** — AWS S3 entegrasyonu

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5.x
- **Veritabanı:** PostgreSQL + TypeORM
- **Doğrulama:** JWT, Argon2
- **Email:** Resend
- **Depolama:** AWS S3
- **Zamanlanmış İşler:** node-cron

## Kurulum

```bash
# Bağımlılıkları kur
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Veritabanını seed'le (test verisi)
npm run seed
```

### Ortam Değişkenleri

`.env` dosyası oluştur ve doldur:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/auro_novel
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=bucket-name
AWS_REGION=your-region

RESEND_API_KEY=your-resend-key
```

## Kullanım

API `http://localhost:3000` adresinde çalışır. Detaylı endpoint dokümantasyonu için proje API dökümanını kontrol et.

### Temel Akışlar

1. **Yazar Kaydı** → Email doğrulaması → Novel oluşturma → Bölüm yayınlama
2. **Okuyucu Kaydı** → Kitaplık oluşturma → Hikaye takip etme → Yorum yapma
3. **Gelir Sistemi** → Okuyucu bölüm görüntüleme → İstatistik hesaplama

## Mimari

```
src/
├── controllers/     # HTTP istek işleyicileri
├── services/        # İş mantığı
├── repositories/    # Veritabanı işlemleri
├── entities/        # TypeORM modelleri
├── schemas/         # Zod doğrulama
├── middlewares/     # Express middleware'leri
├── routers/         # Rota tanımları
├── database/        # Veritabanı yapılandırması
└── utils/           # Yardımcı fonksiyonlar
```

## Lisans

ISC
