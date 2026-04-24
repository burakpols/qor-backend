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

module.exports = {
  getChatResponse,
  getMenuContextualResponse,
  getAnalyticsInsight,
  getAdminChatResponse,
  getAdminAnalystSystemPrompt
};