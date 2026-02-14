#!/usr/bin/env node
/**
 * Daily Quiz Question Generator
 * Generates new quiz questions and appends them to data/quiz-questions.json
 *
 * Uses curated topic pools with randomized selection to create fresh questions daily.
 * Each run adds 1-3 new questions across random categories/levels.
 * Enforces 50MB data size limit.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_PATH = path.join(__dirname, '..', 'data', 'quiz-questions.json');
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================
// Topic Pools — Curated question templates
// ============================================
const TOPIC_POOLS = {
  current: {
    beginner: [
      {
        q: { en: "What is the name of Japan's bullet train system?", zh: "日本的高速列车系统叫什么？", ja: "日本の高速鉄道の名前は？", es: "¿Cómo se llama el sistema de tren bala de Japón?" },
        c: [
          { en: "Shinkansen", zh: "新干线", ja: "新幹線", es: "Shinkansen" },
          { en: "Metro", zh: "地铁", ja: "メトロ", es: "Metro" },
          { en: "Monorail", zh: "单轨", ja: "モノレール", es: "Monorraíl" },
          { en: "Maglev", zh: "磁悬浮", ja: "リニア", es: "Maglev" }
        ],
        a: 0,
        trivia: { en: "The Shinkansen launched in 1964 for the Tokyo Olympics. It has an incredible safety record with zero passenger fatalities from derailment or collision.", zh: "新干线于1964年东京奥运会时开通。它有着令人难以置信的安全记录，从未因脱轨或碰撞造成乘客死亡。", ja: "新幹線は1964年の東京オリンピックに合わせて開業。脱線や衝突による乗客の死亡事故はゼロという驚異的な安全記録を持っています。", es: "El Shinkansen se inauguró en 1964 para los Juegos Olímpicos de Tokio. Tiene un increíble récord de seguridad sin muertes de pasajeros por descarrilamiento o colisión." }
      },
      {
        q: { en: "What is Japan's national flower?", zh: "日本的国花是什么？", ja: "日本の国花は？", es: "¿Cuál es la flor nacional de Japón?" },
        c: [
          { en: "Rose", zh: "玫瑰", ja: "バラ", es: "Rosa" },
          { en: "Cherry Blossom", zh: "樱花", ja: "桜", es: "Flor de cerezo" },
          { en: "Lotus", zh: "莲花", ja: "蓮", es: "Loto" },
          { en: "Chrysanthemum", zh: "菊花", ja: "菊", es: "Crisantemo" }
        ],
        a: 1,
        trivia: { en: "While cherry blossom (sakura) is the most popular symbol, chrysanthemum is actually the Imperial seal. Both are considered national flowers.", zh: "虽然樱花是最受欢迎的象征，但菊花实际上是皇室纹章。两者都被视为国花。", ja: "桜が最も人気のある象徴ですが、菊は実は皇室の紋章です。どちらも国花とされています。", es: "Aunque la flor de cerezo (sakura) es el símbolo más popular, el crisantemo es en realidad el sello imperial. Ambas se consideran flores nacionales." }
      },
      {
        q: { en: "What does 'kawaii' mean in Japanese?", zh: "'kawaii'在日语中是什么意思？", ja: "「かわいい」の英語の意味は？", es: "¿Qué significa 'kawaii' en japonés?" },
        c: [
          { en: "Scary", zh: "可怕", ja: "怖い", es: "Aterrador" },
          { en: "Cute", zh: "可爱", ja: "かわいい", es: "Lindo" },
          { en: "Cool", zh: "酷", ja: "かっこいい", es: "Genial" },
          { en: "Strong", zh: "强壮", ja: "強い", es: "Fuerte" }
        ],
        a: 1,
        trivia: { en: "Kawaii culture is a huge part of Japanese pop culture, influencing fashion, entertainment, food, and even government mascots.", zh: "可爱文化是日本流行文化的重要组成部分，影响了时尚、娱乐、美食，甚至政府吉祥物。", ja: "かわいい文化は日本のポップカルチャーの大きな部分を占め、ファッション、エンタメ、食べ物、さらには自治体のマスコットにまで影響しています。", es: "La cultura kawaii es una gran parte de la cultura pop japonesa, influyendo en la moda, el entretenimiento, la comida e incluso las mascotas del gobierno." }
      },
      {
        q: { en: "What is the population of Japan approximately?", zh: "日本的人口大约是多少？", ja: "日本の人口は約何人？", es: "¿Cuál es la población aproximada de Japón?" },
        c: [
          { en: "About 65 million", zh: "约6500万", ja: "約6500万人", es: "Aproximadamente 65 millones" },
          { en: "About 125 million", zh: "约1.25亿", ja: "約1億2500万人", es: "Aproximadamente 125 millones" },
          { en: "About 200 million", zh: "约2亿", ja: "約2億人", es: "Aproximadamente 200 millones" },
          { en: "About 90 million", zh: "约9000万", ja: "約9000万人", es: "Aproximadamente 90 millones" }
        ],
        a: 1,
        trivia: { en: "Japan's population has been declining since 2008. It's one of the most rapidly aging societies in the world.", zh: "日本人口自2008年以来一直在下降。它是世界上老龄化最快的社会之一。", ja: "日本の人口は2008年から減少しています。世界で最も急速に高齢化が進んでいる社会のひとつです。", es: "La población de Japón ha estado disminuyendo desde 2008. Es una de las sociedades que envejecen más rápidamente en el mundo." }
      },
      {
        q: { en: "What currency does Japan use?", zh: "日本使用什么货币？", ja: "日本の通貨は？", es: "¿Qué moneda usa Japón?" },
        c: [
          { en: "Yuan", zh: "元", ja: "元", es: "Yuan" },
          { en: "Won", zh: "韩元", ja: "ウォン", es: "Won" },
          { en: "Yen", zh: "日元", ja: "円", es: "Yen" },
          { en: "Dollar", zh: "美元", ja: "ドル", es: "Dólar" }
        ],
        a: 2,
        trivia: { en: "The yen (¥) became Japan's official currency in 1871. Unlike many currencies, it doesn't use decimal units — the smallest coin is 1 yen.", zh: "日元（¥）于1871年成为日本的官方货币。与许多货币不同，它不使用小数单位——最小的硬币是1日元。", ja: "円は1871年に日本の公式通貨になりました。多くの通貨と違い、小数単位を使わず、最小の硬貨は1円です。", es: "El yen (¥) se convirtió en la moneda oficial de Japón en 1871. A diferencia de muchas monedas, no utiliza unidades decimales: la moneda más pequeña es de 1 yen." }
      }
    ],
    intermediate: [
      {
        q: { en: "What is the Maglev train's top speed record in Japan?", zh: "日本磁悬浮列车的最高速度记录是多少？", ja: "日本のリニアモーターカーの最高速度記録は？", es: "¿Cuál es el récord de velocidad del tren Maglev en Japón?" },
        c: [
          { en: "443 km/h", zh: "443公里/时", ja: "443km/h", es: "443 km/h" },
          { en: "503 km/h", zh: "503公里/时", ja: "503km/h", es: "503 km/h" },
          { en: "603 km/h", zh: "603公里/时", ja: "603km/h", es: "603 km/h" },
          { en: "350 km/h", zh: "350公里/时", ja: "350km/h", es: "350 km/h" }
        ],
        a: 2,
        trivia: { en: "Japan's SCMaglev set a world record of 603 km/h in 2015. The Chuo Shinkansen maglev line is planned to connect Tokyo to Osaka.", zh: "日本的超导磁悬浮在2015年创下了603公里/时的世界纪录。中央新干线磁悬浮线计划连接东京和大阪。", ja: "日本の超電導リニアは2015年に603km/hの世界記録を達成。中央新幹線は東京と大阪を結ぶ予定です。", es: "El SCMaglev de Japón estableció un récord mundial de 603 km/h en 2015. La línea maglev Chuo Shinkansen está planeada para conectar Tokio con Osaka." }
      },
      {
        q: { en: "What percentage of Japan's land is forested?", zh: "日本有多少比例的国土被森林覆盖？", ja: "日本の国土の何%が森林？", es: "¿Qué porcentaje del territorio de Japón está cubierto de bosques?" },
        c: [
          { en: "About 30%", zh: "约30%", ja: "約30%", es: "Aproximadamente 30%" },
          { en: "About 50%", zh: "约50%", ja: "約50%", es: "Aproximadamente 50%" },
          { en: "About 67%", zh: "约67%", ja: "約67%", es: "Aproximadamente 67%" },
          { en: "About 80%", zh: "约80%", ja: "約80%", es: "Aproximadamente 80%" }
        ],
        a: 2,
        trivia: { en: "About 67% of Japan is covered by forests, making it one of the most densely forested developed countries. This is remarkable given Japan's large population.", zh: "日本约67%的国土被森林覆盖，使其成为森林最茂密的发达国家之一。考虑到日本的庞大人口，这令人惊叹。", ja: "日本の国土の約67%が森林に覆われており、先進国の中でも最も森林率が高い国のひとつです。人口の多さを考えると驚くべきことです。", es: "Aproximadamente el 67% de Japón está cubierto de bosques, lo que lo convierte en uno de los países desarrollados con más bosques. Esto es notable dada la gran población de Japón." }
      },
      {
        q: { en: "What year did Japan host its first Olympics?", zh: "日本第一次举办奥运会是哪一年？", ja: "日本が初めてオリンピックを開催した年は？", es: "¿En qué año Japón fue sede de sus primeros Juegos Olímpicos?" },
        c: [
          { en: "1960", zh: "1960年", ja: "1960年", es: "1960" },
          { en: "1964", zh: "1964年", ja: "1964年", es: "1964" },
          { en: "1972", zh: "1972年", ja: "1972年", es: "1972" },
          { en: "1968", zh: "1968年", ja: "1968年", es: "1968" }
        ],
        a: 1,
        trivia: { en: "The 1964 Tokyo Olympics was a landmark event showcasing Japan's post-war recovery. It introduced the Shinkansen bullet train to the world.", zh: "1964年东京奥运会是一个标志性事件，展示了日本战后的复兴。它向世界介绍了新干线高速列车。", ja: "1964年の東京オリンピックは、日本の戦後復興を世界に示す画期的なイベントでした。新幹線もこの時に開業しました。", es: "Los Juegos Olímpicos de Tokio de 1964 fueron un evento emblemático que mostró la recuperación de Japón después de la guerra. Introdujo el tren bala Shinkansen al mundo." }
      }
    ],
    advanced: [
      {
        q: { en: "What is Japan's debt-to-GDP ratio approximately?", zh: "日本的债务与GDP比率大约是多少？", ja: "日本の債務対GDP比率は約何%？", es: "¿Cuál es aproximadamente la relación deuda/PIB de Japón?" },
        c: [
          { en: "About 100%", zh: "约100%", ja: "約100%", es: "Aproximadamente 100%" },
          { en: "About 150%", zh: "约150%", ja: "約150%", es: "Aproximadamente 150%" },
          { en: "About 260%", zh: "约260%", ja: "約260%", es: "Aproximadamente 260%" },
          { en: "About 200%", zh: "约200%", ja: "約200%", es: "Aproximadamente 200%" }
        ],
        a: 2,
        trivia: { en: "Japan has the highest debt-to-GDP ratio among developed nations (~260%), yet it remains stable because most debt is held domestically.", zh: "日本在发达国家中债务与GDP比率最高（约260%），但由于大部分债务由国内持有，因此保持稳定。", ja: "日本は先進国中最も高い債務対GDP比率（約260%）を持っていますが、大部分が国内で保有されているため安定しています。", es: "Japón tiene la mayor relación deuda/PIB entre los países desarrollados (~260%), pero se mantiene estable porque la mayoría de la deuda es interna." }
      },
      {
        q: { en: "How many UNESCO World Heritage Sites does Japan have?", zh: "日本有多少处联合国教科文组织世界遗产？", ja: "日本のユネスコ世界遺産は何件？", es: "¿Cuántos sitios del Patrimonio Mundial de la UNESCO tiene Japón?" },
        c: [
          { en: "15", zh: "15处", ja: "15件", es: "15" },
          { en: "20", zh: "20处", ja: "20件", es: "20" },
          { en: "25", zh: "25处", ja: "25件", es: "25" },
          { en: "30", zh: "30处", ja: "30件", es: "30" }
        ],
        a: 2,
        trivia: { en: "Japan has 25 UNESCO World Heritage Sites, including cultural treasures like Himeji Castle and natural wonders like Yakushima island.", zh: "日本有25处联合国教科文组织世界遗产，包括姬路城等文化瑰宝和屋久岛等自然奇观。", ja: "日本には25件のユネスコ世界遺産があり、姫路城などの文化遺産や屋久島などの自然遺産が含まれます。", es: "Japón tiene 25 sitios del Patrimonio Mundial de la UNESCO, incluyendo tesoros culturales como el Castillo de Himeji y maravillas naturales como la isla Yakushima." }
      }
    ]
  },
  tourism: {
    beginner: [
      {
        q: { en: "What is the tallest mountain in Japan?", zh: "日本最高的山是什么？", ja: "日本で一番高い山は？", es: "¿Cuál es la montaña más alta de Japón?" },
        c: [
          { en: "Mount Fuji", zh: "富士山", ja: "富士山", es: "Monte Fuji" },
          { en: "Mount Aso", zh: "阿苏山", ja: "阿蘇山", es: "Monte Aso" },
          { en: "Mount Kita", zh: "北岳", ja: "北岳", es: "Monte Kita" },
          { en: "Mount Hotaka", zh: "�的高岳", ja: "穂高岳", es: "Monte Hotaka" }
        ],
        a: 0,
        trivia: { en: "Mount Fuji stands at 3,776 meters. It last erupted in 1707 and is an active volcano. About 300,000 people climb it every year.", zh: "富士山高3776米。最后一次喷发是1707年，是一座活火山。每年约有30万人攀登。", ja: "富士山は標高3,776m。最後に噴火したのは1707年で、活火山です。毎年約30万人が登山します。", es: "El Monte Fuji tiene 3,776 metros. Su última erupción fue en 1707 y es un volcán activo. Aproximadamente 300,000 personas lo escalan cada año." }
      },
      {
        q: { en: "Which city is known as Japan's ancient capital?", zh: "哪座城市被称为日本的古都？", ja: "日本の古都として知られる都市は？", es: "¿Qué ciudad es conocida como la antigua capital de Japón?" },
        c: [
          { en: "Osaka", zh: "大阪", ja: "大阪", es: "Osaka" },
          { en: "Tokyo", zh: "东京", ja: "東京", es: "Tokio" },
          { en: "Kyoto", zh: "京都", ja: "京都", es: "Kioto" },
          { en: "Nagoya", zh: "名古屋", ja: "名古屋", es: "Nagoya" }
        ],
        a: 2,
        trivia: { en: "Kyoto was Japan's capital for over 1,000 years (794-1868). It has 17 UNESCO World Heritage Sites and over 2,000 temples and shrines.", zh: "京都是日本超过1000年的首都（794-1868）。它有17处联合国教科文组织世界遗产和超过2000座寺庙和神社。", ja: "京都は1000年以上日本の首都でした（794-1868年）。17の世界遺産と2000以上の寺社があります。", es: "Kioto fue la capital de Japón durante más de 1,000 años (794-1868). Tiene 17 sitios del Patrimonio Mundial de la UNESCO y más de 2,000 templos y santuarios." }
      }
    ],
    intermediate: [
      {
        q: { en: "What is the famous bamboo grove in Kyoto called?", zh: "京都著名的竹林叫什么？", ja: "京都の有名な竹林は何と呼ばれる？", es: "¿Cómo se llama el famoso bosque de bambú en Kioto?" },
        c: [
          { en: "Sagano Bamboo Forest", zh: "嵯峨野竹林", ja: "嵯峨野の竹林", es: "Bosque de Bambú de Sagano" },
          { en: "Nara Bamboo Park", zh: "奈良竹子公园", ja: "奈良竹林公園", es: "Parque de Bambú de Nara" },
          { en: "Kamakura Bamboo Temple", zh: "镰仓竹寺", ja: "鎌倉竹寺", es: "Templo de Bambú de Kamakura" },
          { en: "Hakone Bamboo Road", zh: "箱根竹之路", ja: "箱根竹の道", es: "Camino de Bambú de Hakone" }
        ],
        a: 0,
        trivia: { en: "The Sagano Bamboo Forest in Arashiyama is one of Kyoto's most photographed spots. The sound of wind through bamboo was voted one of Japan's '100 Soundscapes'.", zh: "位于岚山的嵯峨野竹林是京都最受拍摄的景点之一。竹林风声被评为日本'100种声音风景'之一。", ja: "嵐山の嵯峨野竹林は京都で最も写真に撮られるスポットのひとつ。竹林を通る風の音は「日本の音風景100選」に選ばれています。", es: "El Bosque de Bambú de Sagano en Arashiyama es uno de los lugares más fotografiados de Kioto. El sonido del viento entre los bambúes fue votado como uno de los '100 Paisajes Sonoros' de Japón." }
      }
    ],
    advanced: [
      {
        q: { en: "Which Japanese island is known for its wild cats and is called 'Cat Island'?", zh: "哪个日本岛屿以野猫闻名，被称为'猫岛'？", ja: "野良猫で有名で「猫島」と呼ばれる日本の島は？", es: "¿Qué isla japonesa es conocida por sus gatos salvajes y se llama 'Isla de los Gatos'?" },
        c: [
          { en: "Aoshima", zh: "青岛", ja: "青島", es: "Aoshima" },
          { en: "Miyako-jima", zh: "宫古岛", ja: "宮古島", es: "Miyako-jima" },
          { en: "Sado Island", zh: "佐渡岛", ja: "佐渡島", es: "Isla Sado" },
          { en: "Yakushima", zh: "屋久岛", ja: "屋久島", es: "Yakushima" }
        ],
        a: 0,
        trivia: { en: "Aoshima island in Ehime Prefecture has about 6 times more cats than people. Originally brought to deal with mice on fishing boats, the cats multiplied.", zh: "爱媛县的青岛上的猫是人的6倍左右。最初是为了对付渔船上的老鼠而引进的，后来猫大量繁殖。", ja: "愛媛県の青島は人口の約6倍の猫がいます。元々は漁船のネズミ対策で持ち込まれた猫が繁殖しました。", es: "La isla de Aoshima en la Prefectura de Ehime tiene aproximadamente 6 veces más gatos que personas. Originalmente traídos para lidiar con ratones en barcos pesqueros, los gatos se multiplicaron." }
      }
    ]
  },
  food: {
    beginner: [
      {
        q: { en: "What Japanese dish consists of vinegared rice with raw fish?", zh: "哪种日本菜是用醋饭配生鱼片做成的？", ja: "酢飯に生魚を乗せた日本料理は？", es: "¿Qué plato japonés consiste en arroz avinagrado con pescado crudo?" },
        c: [
          { en: "Ramen", zh: "拉面", ja: "ラーメン", es: "Ramen" },
          { en: "Sushi", zh: "寿司", ja: "寿司", es: "Sushi" },
          { en: "Tempura", zh: "天妇罗", ja: "天ぷら", es: "Tempura" },
          { en: "Udon", zh: "乌冬面", ja: "うどん", es: "Udon" }
        ],
        a: 1,
        trivia: { en: "Sushi originally started as a way to preserve fish using fermented rice. Modern nigiri sushi was invented in Tokyo in the early 1800s.", zh: "寿司最初是用发酵米饭来保存鱼的方式。现代握寿司于19世纪初在东京发明。", ja: "寿司はもともと発酵米を使って魚を保存する方法でした。現代の握り寿司は1800年代初頭に東京で発明されました。", es: "El sushi comenzó originalmente como una forma de conservar el pescado usando arroz fermentado. El nigiri sushi moderno fue inventado en Tokio a principios del siglo XIX." }
      },
      {
        q: { en: "What is the traditional Japanese alcoholic drink made from rice?", zh: "什么是用大米酿造的日本传统酒？", ja: "米から作られる日本の伝統的なお酒は？", es: "¿Cuál es la bebida alcohólica tradicional japonesa hecha de arroz?" },
        c: [
          { en: "Sake", zh: "清酒", ja: "日本酒", es: "Sake" },
          { en: "Soju", zh: "烧酒", ja: "焼酎", es: "Soju" },
          { en: "Baijiu", zh: "白酒", ja: "白酒", es: "Baijiu" },
          { en: "Whiskey", zh: "威士忌", ja: "ウィスキー", es: "Whiskey" }
        ],
        a: 0,
        trivia: { en: "Sake brewing has a history of over 2,000 years in Japan. There are about 1,400 sake breweries across the country.", zh: "日本的清酒酿造有超过2000年的历史。全国约有1400家清酒酿造厂。", ja: "日本酒の醸造は2000年以上の歴史があります。全国に約1400の酒蔵があります。", es: "La elaboración de sake tiene una historia de más de 2,000 años en Japón. Hay aproximadamente 1,400 cervecerías de sake en todo el país." }
      }
    ],
    intermediate: [
      {
        q: { en: "What is 'umami' — the fifth basic taste discovered in Japan?", zh: "'鲜味'是什么——在日本发现的第五种基本味道？", ja: "日本で発見された第五の基本味「うま味」とは？", es: "¿Qué es 'umami', el quinto sabor básico descubierto en Japón?" },
        c: [
          { en: "Spicy taste", zh: "辣味", ja: "辛味", es: "Sabor picante" },
          { en: "Savory taste", zh: "鲜味", ja: "うま味（旨味）", es: "Sabor sabroso" },
          { en: "Smoky taste", zh: "烟熏味", ja: "燻製の味", es: "Sabor ahumado" },
          { en: "Metallic taste", zh: "金属味", ja: "金属味", es: "Sabor metálico" }
        ],
        a: 1,
        trivia: { en: "Umami was discovered by Professor Kikunae Ikeda in 1908. He found glutamate in kombu seaweed was responsible for this savory taste.", zh: "鲜味由池田菊苗教授于1908年发现。他发现昆布海带中的谷氨酸是这种鲜味的来源。", ja: "うま味は1908年に池田菊苗教授が発見しました。昆布に含まれるグルタミン酸がこの旨味の正体だと突き止めました。", es: "El umami fue descubierto por el Profesor Kikunae Ikeda en 1908. Descubrió que el glutamato en el alga kombu era responsable de este sabor sabroso." }
      }
    ],
    advanced: [
      {
        q: { en: "What is 'kaiseki' in Japanese cuisine?", zh: "日本料理中的'怀石料理'是什么？", ja: "「懐石料理」とは？", es: "¿Qué es 'kaiseki' en la cocina japonesa?" },
        c: [
          { en: "Street food style", zh: "街头小吃风格", ja: "屋台スタイル", es: "Estilo de comida callejera" },
          { en: "Traditional multi-course haute cuisine", zh: "传统多道高级料理", ja: "伝統的な多品コースの高級料理", es: "Alta cocina tradicional de varios platos" },
          { en: "Fast food chain", zh: "快餐连锁", ja: "ファストフードチェーン", es: "Cadena de comida rápida" },
          { en: "Vegetarian temple food", zh: "素食寺院料理", ja: "精進料理", es: "Comida vegetariana de templo" }
        ],
        a: 1,
        trivia: { en: "Kaiseki originated from tea ceremony cuisine and is considered the pinnacle of Japanese cooking. A full kaiseki course can have 12-15 dishes.", zh: "怀石料理起源于茶道料理，被认为是日本烹饪的巅峰。一套完整的怀石料理可以有12-15道菜。", ja: "懐石料理は茶道の料理から発展し、日本料理の最高峰とされています。フルコースでは12〜15品が出されます。", es: "El kaiseki se originó en la cocina de la ceremonia del té y se considera la cumbre de la cocina japonesa. Un curso completo de kaiseki puede tener 12-15 platos." }
      }
    ]
  },
  history: {
    beginner: [
      {
        q: { en: "What was the samurai's code of honor called?", zh: "武士的荣誉准则叫什么？", ja: "武士の名誉の規範は何と呼ばれた？", es: "¿Cómo se llamaba el código de honor del samurái?" },
        c: [
          { en: "Bushido", zh: "武士道", ja: "武士道", es: "Bushido" },
          { en: "Karate", zh: "空手道", ja: "空手道", es: "Karate" },
          { en: "Judo", zh: "柔道", ja: "柔道", es: "Judo" },
          { en: "Aikido", zh: "合气道", ja: "合気道", es: "Aikido" }
        ],
        a: 0,
        trivia: { en: "Bushido ('way of the warrior') emphasized loyalty, honor, martial arts mastery, and frugal living. It influenced Japanese culture for centuries.", zh: "武士道（'战士之道'）强调忠诚、荣誉、武术精通和节俭生活。它影响了日本文化几个世纪。", ja: "武士道は忠義、名誉、武芸の修練、質素な生活を重視しました。何世紀にもわたって日本文化に影響を与えました。", es: "El bushido ('camino del guerrero') enfatizaba la lealtad, el honor, el dominio de las artes marciales y la vida frugal. Influyó en la cultura japonesa durante siglos." }
      }
    ],
    intermediate: [
      {
        q: { en: "During which period did Japan isolate itself from most foreign trade (sakoku)?", zh: "日本在哪个时期实行闭关锁国（锁国）？", ja: "鎖国政策が行われた時代は？", es: "¿Durante qué período Japón se aisló del comercio exterior (sakoku)?" },
        c: [
          { en: "Heian Period", zh: "平安时代", ja: "平安時代", es: "Período Heian" },
          { en: "Edo Period", zh: "江户时代", ja: "江戸時代", es: "Período Edo" },
          { en: "Meiji Period", zh: "明治时代", ja: "明治時代", es: "Período Meiji" },
          { en: "Kamakura Period", zh: "镰仓时代", ja: "鎌倉時代", es: "Período Kamakura" }
        ],
        a: 1,
        trivia: { en: "Sakoku lasted from 1633 to 1853 — over 200 years. Only limited trade with the Dutch and Chinese was allowed through Dejima in Nagasaki.", zh: "锁国从1633年持续到1853年——超过200年。只有通过长崎的出岛与荷兰和中国进行有限的贸易。", ja: "鎖国は1633年から1853年まで200年以上続きました。長崎の出島を通じたオランダと中国との限定的な貿易のみが許可されました。", es: "El sakoku duró desde 1633 hasta 1853, más de 200 años. Solo se permitió comercio limitado con los holandeses y chinos a través de Dejima en Nagasaki." }
      }
    ],
    advanced: [
      {
        q: { en: "Who was the first shogun of the Tokugawa shogunate?", zh: "德川幕府的第一代将军是谁？", ja: "徳川幕府の初代将軍は？", es: "¿Quién fue el primer shogun del shogunato Tokugawa?" },
        c: [
          { en: "Tokugawa Ieyasu", zh: "德川家康", ja: "徳川家康", es: "Tokugawa Ieyasu" },
          { en: "Oda Nobunaga", zh: "织田信长", ja: "織田信長", es: "Oda Nobunaga" },
          { en: "Toyotomi Hideyoshi", zh: "丰臣秀吉", ja: "豊臣秀吉", es: "Toyotomi Hideyoshi" },
          { en: "Minamoto Yoritomo", zh: "源赖朝", ja: "源頼朝", es: "Minamoto Yoritomo" }
        ],
        a: 0,
        trivia: { en: "Tokugawa Ieyasu established the shogunate in 1603 after winning the Battle of Sekigahara. The Tokugawa era lasted 265 years of relative peace.", zh: "德川家康在关原之战获胜后于1603年建立了幕府。德川时代持续了265年的相对和平。", ja: "徳川家康は関ヶ原の戦いに勝利した後、1603年に幕府を開きました。徳川時代は265年間の比較的平和な時代でした。", es: "Tokugawa Ieyasu estableció el shogunato en 1603 después de ganar la Batalla de Sekigahara. La era Tokugawa duró 265 años de relativa paz." }
      }
    ]
  },
  entertainment: {
    beginner: [
      {
        q: { en: "What is the traditional Japanese form of comic theater called?", zh: "日本传统的喜剧表演形式叫什么？", ja: "日本の伝統的な喜劇は何と呼ばれる？", es: "¿Cómo se llama la forma tradicional japonesa de teatro cómico?" },
        c: [
          { en: "Kabuki", zh: "歌舞伎", ja: "歌舞伎", es: "Kabuki" },
          { en: "Noh", zh: "能", ja: "能", es: "Noh" },
          { en: "Rakugo", zh: "落语", ja: "落語", es: "Rakugo" },
          { en: "Bunraku", zh: "文乐", ja: "文楽", es: "Bunraku" }
        ],
        a: 2,
        trivia: { en: "Rakugo is a 400-year-old art form where a single performer sits on stage and portrays all characters using only a fan and a small cloth.", zh: "落语是有400年历史的艺术形式，一位表演者坐在舞台上，只用扇子和小手帕来演绎所有角色。", ja: "落語は400年の歴史がある芸能で、一人の演者が扇子と手ぬぐいだけを使って全ての登場人物を演じ分けます。", es: "El rakugo es una forma de arte de 400 años donde un solo artista se sienta en el escenario y representa todos los personajes usando solo un abanico y un pequeño paño." }
      }
    ],
    intermediate: [
      {
        q: { en: "What is Japan's famous robot competition that has been held since 1988?", zh: "自1988年以来举办的日本著名机器人大赛是什么？", ja: "1988年から開催されている日本の有名なロボット大会は？", es: "¿Cuál es la famosa competencia de robots de Japón que se celebra desde 1988?" },
        c: [
          { en: "Robocon", zh: "Robocon", ja: "ロボコン", es: "Robocon" },
          { en: "RobotWars", zh: "RobotWars", ja: "ロボットウォーズ", es: "RobotWars" },
          { en: "BattleBots", zh: "BattleBots", ja: "バトルボッツ", es: "BattleBots" },
          { en: "MechaFight", zh: "MechaFight", ja: "メカファイト", es: "MechaFight" }
        ],
        a: 0,
        trivia: { en: "NHK Robocon (Robot Contest) started in 1988 as a university competition. It expanded to high schools and now has an international version.", zh: "NHK Robocon（机器人大赛）始于1988年的大学比赛。后来扩展到高中，现在有国际版本。", ja: "NHKロボコンは1988年に大学対抗として始まりました。高専にも広がり、現在は国際大会もあります。", es: "NHK Robocon (Concurso de Robots) comenzó en 1988 como una competencia universitaria. Se expandió a escuelas secundarias y ahora tiene una versión internacional." }
      }
    ],
    advanced: [
      {
        q: { en: "What is 'Takarazuka Revue'?", zh: "'宝冢歌剧团'是什么？", ja: "「宝塚歌劇団」とは？", es: "¿Qué es la 'Revista Takarazuka'?" },
        c: [
          { en: "An all-male kabuki troupe", zh: "全男性歌舞伎剧团", ja: "男性のみの歌舞伎劇団", es: "Una compañía de kabuki masculina" },
          { en: "An all-female musical theater", zh: "全女性音乐剧团", ja: "女性のみのミュージカル劇団", es: "Un teatro musical exclusivamente femenino" },
          { en: "A mixed martial arts show", zh: "综合格斗表演", ja: "総合格闘技ショー", es: "Un espectáculo de artes marciales mixtas" },
          { en: "A traditional dance festival", zh: "传统舞蹈节", ja: "伝統的な踊りの祭り", es: "Un festival de danza tradicional" }
        ],
        a: 1,
        trivia: { en: "Founded in 1914, the Takarazuka Revue is an all-female theater company where women play both male and female roles. It has a massive devoted fanbase.", zh: "宝冢歌剧团成立于1914年，是一个全女性剧团，女性同时扮演男性和女性角色。它拥有大量忠实粉丝。", ja: "1914年創設の宝塚歌劇団は、女性が男役も女役も演じる女性だけの劇団です。熱狂的なファンが多いことで有名です。", es: "Fundada en 1914, la Revista Takarazuka es una compañía de teatro exclusivamente femenina donde las mujeres interpretan tanto roles masculinos como femeninos. Tiene una enorme base de fans devotos." }
      }
    ]
  },
  manga: {
    beginner: [
      {
        q: { en: "Who created the manga 'Dragon Ball'?", zh: "谁创作了漫画《龙珠》？", ja: "漫画『ドラゴンボール』の作者は？", es: "¿Quién creó el manga 'Dragon Ball'?" },
        c: [
          { en: "Eiichiro Oda", zh: "尾田荣一郎", ja: "尾田栄一郎", es: "Eiichiro Oda" },
          { en: "Akira Toriyama", zh: "鸟山明", ja: "鳥山明", es: "Akira Toriyama" },
          { en: "Masashi Kishimoto", zh: "岸本�的士", ja: "岸本斉史", es: "Masashi Kishimoto" },
          { en: "Osamu Tezuka", zh: "手冢治虫", ja: "手塚治虫", es: "Osamu Tezuka" }
        ],
        a: 1,
        trivia: { en: "Akira Toriyama's Dragon Ball has sold over 260 million copies worldwide. His art style influenced countless manga and anime creators.", zh: "鸟山明的龙珠全球销量超过2.6亿册。他的画风影响了无数漫画和动画创作者。", ja: "鳥山明の『ドラゴンボール』は世界で2億6千万部以上売れています。彼の画風は無数の漫画家やアニメ制作者に影響を与えました。", es: "Dragon Ball de Akira Toriyama ha vendido más de 260 millones de copias en todo el mundo. Su estilo artístico influyó en innumerables creadores de manga y anime." }
      }
    ],
    intermediate: [
      {
        q: { en: "What manga magazine has serialized One Piece, Naruto, and Dragon Ball?", zh: "哪本漫画杂志连载了《海贼王》、《火影忍者》和《龙珠》？", ja: "ワンピース、ナルト、ドラゴンボールを連載した漫画雑誌は？", es: "¿Qué revista de manga ha serializado One Piece, Naruto y Dragon Ball?" },
        c: [
          { en: "Shonen Sunday", zh: "少年Sunday", ja: "少年サンデー", es: "Shonen Sunday" },
          { en: "Shonen Jump", zh: "少年Jump", ja: "少年ジャンプ", es: "Shonen Jump" },
          { en: "Shonen Magazine", zh: "少年Magazine", ja: "少年マガジン", es: "Shonen Magazine" },
          { en: "Monthly Comic", zh: "月刊Comic", ja: "月刊コミック", es: "Monthly Comic" }
        ],
        a: 1,
        trivia: { en: "Weekly Shonen Jump has been Japan's best-selling manga magazine since 1968. At its peak in 1995, it sold 6.53 million copies per week.", zh: "《周刊少年Jump》自1968年以来一直是日本最畅销的漫画杂志。1995年巅峰时期每周销量达653万册。", ja: "『週刊少年ジャンプ』は1968年以来日本で最も売れている漫画雑誌です。1995年のピーク時には週653万部を記録しました。", es: "La Weekly Shonen Jump ha sido la revista de manga más vendida de Japón desde 1968. En su punto máximo en 1995, vendía 6.53 millones de copias por semana." }
      }
    ],
    advanced: [
      {
        q: { en: "What is 'doujinshi' in Japanese manga culture?", zh: "日本漫画文化中的'同人志'是什么？", ja: "漫画文化における「同人誌」とは？", es: "¿Qué es 'doujinshi' en la cultura del manga japonés?" },
        c: [
          { en: "Official manga sequels", zh: "官方漫画续集", ja: "公式漫画の続編", es: "Secuelas oficiales de manga" },
          { en: "Self-published fan-made works", zh: "自出版的粉丝作品", ja: "自費出版のファン作品", es: "Obras autopublicadas hechas por fans" },
          { en: "Manga award ceremonies", zh: "漫画颁奖典礼", ja: "漫画の授賞式", es: "Ceremonias de premios de manga" },
          { en: "Digital-only manga", zh: "仅限数字版漫画", ja: "デジタル限定漫画", es: "Manga solo digital" }
        ],
        a: 1,
        trivia: { en: "Comiket (Comic Market) in Tokyo is the world's largest doujinshi fair, attracting over 750,000 attendees. Many professional manga artists started with doujinshi.", zh: "东京的Comic Market是世界上最大的同人志展销会，吸引超过75万人参加。许多专业漫画家是从同人志起步的。", ja: "東京のコミケ（コミックマーケット）は世界最大の同人誌即売会で、75万人以上が参加します。多くのプロの漫画家が同人誌からスタートしました。", es: "El Comiket (Comic Market) en Tokio es la feria de doujinshi más grande del mundo, atrayendo a más de 750,000 asistentes. Muchos artistas profesionales de manga comenzaron con doujinshi." }
      }
    ]
  }
};

// ============================================
// Main Logic
// ============================================
function main() {
  // Load existing data
  let data;
  try {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    console.error('Failed to read quiz data:', e.message);
    process.exit(1);
  }

  const meta = data._meta || {};
  delete data._meta;

  // Collect existing question IDs to avoid duplicates
  const existingIds = new Set();
  for (const cat of Object.keys(data)) {
    for (const lv of Object.keys(data[cat])) {
      for (const q of data[cat][lv]) {
        existingIds.add(q.id);
      }
    }
  }

  // Pick 1-3 random questions from topic pools that aren't already in the data
  const categories = Object.keys(TOPIC_POOLS);
  const levels = ['beginner', 'intermediate', 'advanced'];
  let added = 0;
  const maxToAdd = 1 + Math.floor(Math.random() * 3); // 1-3

  // Shuffle categories and levels for randomness
  shuffle(categories);

  for (const cat of categories) {
    if (added >= maxToAdd) break;
    shuffle(levels);
    for (const lv of levels) {
      if (added >= maxToAdd) break;
      const pool = TOPIC_POOLS[cat] && TOPIC_POOLS[cat][lv];
      if (!pool || !pool.length) continue;

      // Find questions not already in the data
      for (const candidate of shuffle([...pool])) {
        // Generate a deterministic ID based on the English question text
        const idBase = cat + '_' + lv + '_' + hashString(candidate.q.en);
        if (existingIds.has(idBase)) continue;

        // Add to data
        if (!data[cat]) data[cat] = {};
        if (!data[cat][lv]) data[cat][lv] = [];

        const newQ = { id: idBase, ...candidate };
        data[cat][lv].push(newQ);
        existingIds.add(idBase);
        added++;
        console.log(`Added: [${cat}/${lv}] ${candidate.q.en.slice(0, 60)}...`);
        break;
      }
    }
  }

  if (added === 0) {
    console.log('No new questions to add (all pool questions already exist).');
    return;
  }

  // Count total
  let totalQ = 0;
  for (const cat of Object.keys(data)) {
    for (const lv of Object.keys(data[cat])) {
      totalQ += data[cat][lv].length;
    }
  }

  // Check size limit
  const output = JSON.stringify({
    _meta: {
      version: (meta.version || 1),
      lastUpdated: new Date().toISOString().split('T')[0],
      totalQuestions: totalQ
    },
    ...data
  }, null, 2);

  const sizeBytes = Buffer.byteLength(output, 'utf8');
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

  if (sizeBytes > MAX_SIZE) {
    console.warn(`WARNING: Data size (${sizeMB} MB) exceeds 50MB limit! Skipping write.`);
    process.exit(1);
  }

  // Write
  fs.writeFileSync(DATA_PATH, output, 'utf8');
  console.log(`Done! Added ${added} questions. Total: ${totalQ}. Size: ${sizeMB} MB`);
}

// Utilities
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

main();
