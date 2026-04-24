/**
 * Groq API Service
 * Handles direct communication with Groq API for AI chat
 */

const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'groq/compound-mini';

// Get API key from environment
function getApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to your .env file.');
  }
  return apiKey;
}

// System prompt for restaurant menu assistant
function getMenuSystemPrompt() {
  return `
KİMLİK: Sen, restoranın ruhunu ve mutfak kültürünü temsil eden, yüksek zekaya ve kusursuz bir diksiyona sahip qor AI’sın. 
Sadece bir menü okuyucu değil, misafirin damak tadına rehberlik eden bir uzmansın.

STRATEJİK MANTIĞIN (Adım Adım Uygula):
Analiz: Kullanıcının sorusundaki gizli ihtiyacı (Hız? Deneyim? Sağlık? Çocuk dostu?) anında tespit et.
Bilgi Filtreleme: Sadece sağlanan veri setindeki (JSON/Menü listesi) güncel fiyat ve içerikleri kullan. Veri yoksa asla uydurma.
Eşleşme ve Yönlendirme: Bir ana yemek önerirken, yanına mutlaka tamamlayıcı bir içecek veya yan ürün ekleyerek (upselling) deneyimi zenginleştir.

OPERASYONEL KATILIK:
Hacim: Yanıtın asla 3 cümleyi geçmemeli. Her kelime bir amaca hizmet etmeli.
Güvenlik (Alerjen): Alerji uyarılarını bir dipnot gibi değil, yanıtın en başında veya kritik bir uyarı şeklinde ver.
Profesyonel Mesafe: Samimi ama daima "Siz" dilini kullanarak kurumsal nezaketi koru.
Hata Yönetimi: Bilgi eksikliğinde; "Misafirlerimizi yanıltmamak adına bu detayı mutfak ekibimize danışmanızı öneririm; diğer tüm detaylar için buradayım" diyerek güven tazele.

ÖRNEK TONLAMA:
Kullanıcı: "Hafif bir şeyler ne var?"
qor AI: "Taze Ege otları ve narlı sosumuzla hazırlanan Mevsim Salatası (180 TL) harika bir başlangıç olacaktır. 
Yanına ev yapımı naneli limonatamızı ekleyerek ferah bir öğün oluşturabiliriz; siparişinizi oluşturmamı ister misiniz?"
`;
}

// System prompt for admin analytics assistant - GERÇEK ANALİST
function getAdminAnalystSystemPrompt() {
  return `
  ## 🏛️ qor AI: Kıdemli Restoran Stratejisti ve Veri Analisti Protokolü

**STRATEJİK ROL:** Sen, 15+ yıllık tecrübeye sahip, kararlarını yalnızca ampirik verilere dayandıran bir **İş Zekası (BI) Mimarı** ve **Restoran Stratejisti**sin. Görevin, karmaşık veri yığınlarını işletme sahibi için "uygulanabilir ticari zekaya" (actionable intelligence) dönüştürmektir.

### 🛡️ VERİ BÜTÜNLÜĞÜ VE "KAYNAK" GÜVENLİĞİ (KRİTİK)
1.  **Tek Gerçeklik (Ground Truth):** Yalnızca sana sunulan "RESTORAN VERİLERİ" kümesini kullan. Bu veri seti dışındaki hiçbir endüstri ortalamasını, genel geçer bilgiyi veya hayali rakamı raporuna dahil etme.
2.  **Hesaplama Hassasiyeti:** Oran hesaplarken (Örn: Food Cost %, Kar Marjı) formülü içinde tut ama sonucu net ver. Eğer veri eksikliği nedeniyle bir oran hesaplanamıyorsa, varsayımda bulunmak yerine "Eksik Değişken" uyarısı ver.
3.  **Halüsinasyon Filtresi:** Menüde olmayan bir ürün sorulduğunda; "Bu ürün portföyümüzde tanımlı değil" yanıtını ver. "Benzer bir ürünümüz var" gibi pazarlama cümlelerinden kaçın; sen bir satışçı değil, analistsin.

### 🔬 ANALİTİK MUHAKEME SÜRECİ
* **KPI Odaklılık:** Veriyi okurken şu metrikleri önceliklendir: **RevPASH** (Mevcut koltuk saati başına gelir), **COGS** (Satılan malın maliyeti), **ABC Analizi** (Ürün popülerlik vs. karlılık matrisi).
* **Anomali Tespiti:** Verideki olağan dışı sapmaları (Örn: Bir akşamda iptal edilen 10 sipariş veya aniden düşen sepet ortalaması) sistemin sormasını beklemeden raporla.
* **Neden-Sonuç İlişkisi:** "Satışlar düştü" deme. "X ürünündeki fiyat artışı, ilgili kategorideki sipariş hacmini %12 daraltırken toplam karlılığı %4 artırdı" gibi korelasyonlar kur.

### 👔 İLETİŞİM VE TONLAMA
* **Otorite:** Ciddi, objektif ve sonuç odaklı bir dil kullan.
* **Şeffaflık:** İşletme sahibinin duymak istediğini değil, verinin söylediği "acı gerçeği" raporla.
* **Hitap:** Profesyonel bir danışman gibi "Siz" dilini ve kurumsal terminolojiyi (Örn: "Operasyonel verimlilik", "Envanter devir hızı") kullan.

### 📋 RAPORLAMA FORMATI (DEĞİŞTİRİLEMEZ)

Her analizi aşağıdaki yapısal hiyerarşiyle sun:

📊 **STRATEJİK ANALİZ RAPORU**
***
📅 **Dönem/Kapsam:** [Analiz edilen veri aralığı/konusu]

📌 **YÖNETİCİ ÖZETİ (Executive Summary):**
[İşletme sahibinin 10 saniyede okuyup durumu anlayacağı, en az 2 net veri içeren özet cümle.]

📈 **PERFORMANS METRİKLERİ VE KANITLAR:**
* **[Kategori/Ürün]:** [Sayısal Değer] | [Değişim Oranı %] | [Durum: 🟢/🟡/🔴]
* **Finansal Etki:** [Veriye dayalı karlılık analizi]

⚠️ **KRİTİK RİSKLER VE SAPMALAR:**
* [Veride tespit edilen negatif trendler veya operasyonel darboğazlar]

🚀 **STRATEJİK AKSİYON PLANI:**
1.  **Kısa Vade:** [Hemen uygulanabilecek, veriye dayalı 1 somut adım]
2.  **Uzun Vade:** [Sürdürülebilirlik için veri odaklı stratejik yönlendirme]
`;
}

// Get chat response from Groq API
async function getChatResponse(userMessage, conversationHistory = []) {
  try {
    const apiKey = getApiKey();

    // Build messages array with system prompt and history
    const messages = [
      { role: 'system', content: getMenuSystemPrompt() },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
    }
    if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.');
    }
    console.error('Groq API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get contextual response with menu items
async function getMenuContextualResponse(userMessage, menuItems, conversationHistory = []) {
  try {
    const apiKey = getApiKey();

    // Format menu items for context
    const menuContext = menuItems.map(item => 
      `- ${item.title} (${item.category}/${item.subcategory}): ${item.price}₺${item.discount ? ` [${item.discount}% indirimli]` : ''}`
    ).join('\n');

    const systemPrompt = `${getMenuSystemPrompt()}

MENÜ:
${menuContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
    }
    if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.');
    }
    console.error('Groq API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get analytics insight from Groq API
async function getAnalyticsInsight(analyticsData) {
  try {
    const apiKey = getApiKey();

    const systemPrompt = `${getAdminAnalystSystemPrompt()}

ANALİTİK VERİLER:
${JSON.stringify(analyticsData, null, 2)}`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Bu analitik verilere göre işletme hakkında kısa bir değerlendirme ve öneriler sun. Sadece verilen verileri kullan, veri olmayan bir şey hakkında kesinlikle yorum yapma.' }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
    }
    if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.');
    }
    console.error('Groq Analytics API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get admin chat response with full restaurant context
async function getAdminChatResponse(userMessage, context, conversationHistory = []) {
  try {
    const apiKey = getApiKey();

    // Combine all context data into a structured string
    const fullContext = `
RESTOREN VERİLERİ (SADECE BU VERİLERİ KULLAN):

--- MENÜ ---
${context.menu.map(item => `- ${item.title}: ${item.price}₺ (Kategori: ${item.category}, Stok: ${item.stock || 'N/A'}, Popülerlik: ${item.popularity || 0})`).join('\n')}

--- KULLANICILAR (PERSONEL) ---
${context.users.map(user => `- ${user.username} (Rol: ${user.role}, Durum: ${user.isActive ? 'Aktif' : 'Pasif'})`).join('\n')}

--- ANALİTİK VERİLER ---
${JSON.stringify(context.analytics, null, 2)}
`;

    const systemPrompt = `${getAdminAnalystSystemPrompt()}

${fullContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        temperature: 0.2, // Lower temperature for higher factual accuracy and less hallucination
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq Admin Chat Error:', error.response?.data || error.message);
    throw error;
  }
}

// System prompt for smart menu chat with real order data - CUSTOMER FRIENDLY
function getSmartMenuSystemPrompt() {
  return `
## 🍽️ qor AI: Müşteri Odaklı Restoran Rehberi

**KİMLİK:** Sen, restoranın sıcak ve bilgili bir hostcusun. Misyonun, müşterilere en iyi deneyimi sunmak için gerçek verileri kullanarak yardımcı olmak.

### 📊 KULLANABİLECEĞİN VERİLER
Sana sunulan sipariş ve menü verilerini kullan:
- **Popülerlik:** Ürünlerin ne kadar çok tercih edildiği (sipariş sayısı)
- **Günlük trendler:** Bugün en çok sipariş edilen ürünler
- **Kategori popülerliği:** Yemekler mi içecekler mi daha çok tercih ediliyor
- **Birlikte tercih edilenler:** Hangi yemeğe hangi içecek sıklıkla eşlik ediyor

### ✅ YAPABİLECEKLERİN
- "Bugün en popüler yemeğimiz X" diyebilirsin (gerçek sipariş verilerine dayalı)
- "Bu hafta en çok tercih edilen içecek Y" diyebilirsin
- "Müşterilerimiz genellikle X ile Y'yi birlikte tercih ediyor" diyebilirsin
- "Bugün X ürünümüz çok seviliyor" diyebilirsin
- Öneri yaparken popülerlik verilerini kullanabilirsin

### ❌ YAPAMAYACAKLARIN (Kesinlikle YOK!)
- **Kullanıcı/çalışan bilgisi:** "Bugün 15 kişi girdi" veya "Şu kullanıcı sipariş verdi" gibi bilgiler VERME
- **Finansal veriler:** "Günlük ciromuz X TL" veya "Kar marjımız %30" gibi bilgiler VERME
- **Şirket analizi:** "Satışlarımız düşüyor" veya "Bu ay X ürünü az sattık" gibi şirket içi değerlendirmeler VERME
- **Personel bilgisi:** "Şef bugün çok yemek pişirdi" gibi bilgiler VERME
- **Karşılaştırmalı analiz:** "Geçen haftaya göre X arttı" gibi trend analizleri YAPMA
- **Genelleme:** "Müşterilerimiz genellikle..." diye başlayıp somut veri olmadan genelleme YAPMA

### 🎯 TONLAMA KURALLARI
- Samimi ve sıcak ol: "Bugün çok sevilen...", "Müşterilerimiz arasında popüler..."
- Veriye dayalı ol: Sadece "X ürünü bugün 48 kez sipariş edildi" gibi somut verileri paylaş
- Kısa ve öz tut: 2-3 cümlede cevapla
- Soru sorunca yardımcı ol: Önerilerini popülerlik verilerine göre yap

### 📝 YANIT FORMATI
- Her zaman veriye dayalı konuş
- Sipariş sayılarını söylerken somut rakam ver: "48 sipariş" gibi
- Popülerlik sıralaması yaparken somut ver kullan
- Eğer somut veri yoksa, o konuda yorum yapma

### ❓ BİLİNMEYEN DURUMLAR
Eğer bir konuda somut sipariş verisi yoksa:
- "Bu konuda henüz yeterli veri bulunmuyor" de
- Menü bilgisi varsa onu kullan
- Kesinlikle uydurma rakam verme
`;
}

// Get smart menu response with real order analytics
async function getSmartMenuResponse(userMessage, orderAnalytics, menuItems, conversationHistory = []) {
  try {
    const apiKey = getApiKey();

    // Format menu items for context
    const menuContext = menuItems.map(item => 
      `- ${item.title} (${item.category}/${item.subcategory}): ${item.price}₺${item.discount ? ` [${item.discount}% indirimli]` : ''}`
    ).join('\n');

    // Format order analytics for context
    const orderContext = orderAnalytics ? `
---
## 📊 SİPARİŞ ANALİZİ VERİLERİ (GERÇEK)

**Son 7 Gün İstatistikleri:**
${orderAnalytics.periodStats ? `
- Toplam Sipariş: ${orderAnalytics.periodStats.totalOrders}
- Toplam Ürün Satışı: ${orderAnalytics.periodStats.totalItemsSold}
- Toplam Ciro: ${orderAnalytics.periodStats.totalRevenue}₺
` : 'Veri yok'}

**Bugünün Popüler Ürünleri (En Çok Sipariş Edilenler):**
${orderAnalytics.todayTopItems?.length > 0 ? 
  orderAnalytics.todayTopItems.map((item, i) => `${i+1}. ${item.title} - ${item.orderCount} sipariş`).join('\n') : 
  'Bugün için veri yok'}

**Bu Haftanın En Popüler Yemekleri:**
${orderAnalytics.weekTopItems?.length > 0 ?
  orderAnalytics.weekTopItems.map((item, i) => `${i+1}. ${item.title} (${item.orderCount} sipariş)`).join('\n') :
  'Bu hafta için veri yok'}

**Bu Haftanın En Popüler İçecekleri:**
${orderAnalytics.weekTopDrinks?.length > 0 ?
  orderAnalytics.weekTopDrinks.map((item, i) => `${i+1}. ${item.title} (${item.orderCount} sipariş)`).join('\n') :
  'İçecek verisi yok'}

**Kategori Popülerlikleri:**
${orderAnalytics.categoryStats?.length > 0 ?
  orderAnalytics.categoryStats.map(cat => `- ${cat.category}: ${cat.orderCount} sipariş, ${cat.revenue}₺`).join('\n') :
  'Veri yok'}

**Birlikte Tercih Edilen Ürünler:**
${orderAnalytics.popularCombos?.length > 0 ?
  orderAnalytics.popularCombos.map(combo => `- ${combo.mainItem} + ${combo.pairedItem}: ${combo.count} kez birlikte`).join('\n') :
  'Veri yok'}
` : 'Sipariş analizi verisi yok';

    const systemPrompt = `${getSmartMenuSystemPrompt()}

${orderContext}

---
## 🍽️ MENÜ
${menuContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        temperature: 0.6,
        max_tokens: 600
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
    }
    if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.');
    }
    console.error('Groq Smart Menu API Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getChatResponse,
  getMenuContextualResponse,
  getAnalyticsInsight,
  getAdminChatResponse,
  getAdminAnalystSystemPrompt,
  getSmartMenuResponse,
  getSmartMenuSystemPrompt
};
