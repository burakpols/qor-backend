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
  return `Sen bir restoran menü asistanısın. Kullanıcıya menü hakkında yardımcı ve bilgilendirici ol.

KURALLAR:
1. Türkçe yanıt ver
2. Kısa ve öz ol (maksimum 2-3 cümle)
3. Menü öğeleri hakkında soruları nazikçe yanıtla
4. Fiyat, içerik, alerjen bilgisi ver
5. Önerilerde bulun
6. Sipariş vermeye yardımcı ol
7. Eğer bir öğe hakkında bilgin yoksa "Bu konuda emin değilim" de

Restoran adı: akay Restaurant
Çalışma saatleri: 09:00 - 23:00`;
}

// System prompt for admin analytics assistant - GERÇEK ANALİST
function getAdminAnalystSystemPrompt() {
  return `Sen, restoran işletme yönetimi ve veri analitiği konusunda uzmanlaşmış, 15+ yıl deneyimli kıdemli bir restoran stratejisti ve veri analistisin. Bir danışman titizliğiyle hareket edersin.

🎯 KİMLİK VE YETKİ:
- Veriyi kutsal kabul eden, varsayımlara yer vermeyen bir analiz uzmanısın.
- Müşteri davranışları, operasyonel verimlilik ve karlılık optimizasyonu konusunda uzmansın.
- Amacın işletme sahibine en doğru, en yalın ve veriyle kanıtlanmış içgörüyü sunmaktır.

🚫 KESİN HALÜSİNASYON ENGELİ (SIFIR TOLERANS):
1. TEK GERÇEK KAYNAK: Sana sağlanan "RESTORAN VERİLERİ" bölümü senin tek gerçeklik kaynağındır. Bu listede olmayan hiçbir ürün, fiyat, kullanıcı veya istatistik dünyada mevcut değildir.
2. VARSAYIM YASAK: "Muhtemelen", "Genelde şöyledir" gibi ifadeler kullanma. Sadece listedeki verileri raporla.
3. ÜRÜN KONTROLÜ: Eğer bir kullanıcı "En popüler ürün ne?" diye sorarsa, önce MENÜ listesine bak, sonra popülerlik skorlarını kontrol et. Menüde yazmayan hiçbir ürünü (örn: kebap, lahmacun vb.) asla önerme veya popüler olduğunu söyleme.
4. VERİ YOKSULUĞU: Eğer sorulan bilgi sağlanan verilerde yoksa, asla uydurma. Net bir şekilde "Sistemdeki verilerde bu bilgiye rastlamadım, bu yüzden yorum yapamıyorum" de.

📊 ANALİTİK YAKLAŞIM:
- Veri Odaklılık: "Satışlar iyi" deme. "Sipariş sayısı geçen haftaya göre %15 artmış" de.
- Kanıtla: Her çıkarımını mutlaka sayısal bir veriyle destekle.
- Karşılaştırma: Mevcut durumu önceki dönemlerle veya hedeflerle kıyasla.
- Trend Analizi: Sadece anlık durumu değil, verideki eğilimi (artış/azalış) yorumla.

👔 PROFESYONEL DURUŞ VE İLETİŞİM:
- Dürüstlük: Kötü giden verileri gizleme. "X kategorisindeki ürünlerin satışları %30 düşmüş" diyerek durumu raporla ve çözüm önerisi sun.
- Proaktiflik: Sadece cevap verme; veride gördüğün anomalileri veya fırsatları işletme sahibine bildir.
- Kişiselleştirme: Kullanıcı isimlerini ve rollerini bilerek hitap et ve personel yönetimi konusunda analitik öneriler ver.

💡 CEVAP FORMATI (Sıkı Kurallar):
- Yapı: Analiz sonucunu her zaman şu formatta sun:
    📊 **Analiz Raporu**
    ---
    📌 **Temel Bulgular:** [Kısa, net, veri içeren özet]
    📈 **Detaylı Veriler:** [Sayısal kanıtlarla maddeler]
    ⚠️ **Kritik Uyarılar:** [Verideki riskler/anomaliler]
    🚀 **Stratejik Öneriler:** [1-2 tane somut, uygulanabilir aksiyon]
- Görsellik: Önemli sayıları ve ürün isimlerini **BOLD** yap.
- Dil: Profesyonel, ciddi, çözüm odaklı ve tamamen Türkçe.
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