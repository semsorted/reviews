const COMMONS = "https://thumb.wikimedia.org/wikipedia/commons/thumb";

export const PHOTOS = {
  chai: {
    src: `${COMMONS}/6/6b/Kerala-style_Glass_of_Chai_%28Tea%29.jpg/1280px-Kerala-style_Glass_of_Chai_%28Tea%29.jpg`,
    alt: "A frothy glass of hot chai on a wooden table",
    title: "Kerala-style Glass of Chai",
    author: "Navaneethpp",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Kerala-style_Glass_of_Chai_(Tea).jpg",
  },
  sweets: {
    src: `${COMMONS}/0/04/Burfi_and_Peda%2C_Indian_Sweets_Mithai_Chennai_India.jpg/1280px-Burfi_and_Peda%2C_Indian_Sweets_Mithai_Chennai_India.jpg`,
    alt: "Trays of burfi and peda in an Indian sweet shop",
    title: "Burfi and Peda, Chennai",
    author: "Melanie M",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "https://commons.wikimedia.org/wiki/File:Burfi_and_Peda,_Indian_Sweets_Mithai_Chennai_India.jpg",
  },
} as const;

export type StoryLanguage = "hinglish" | "hi" | "en";
export type StoryText = { trade: string; title: string; teaser: string; paragraphs: string[] };
export type Story = { slug: string; tone: "blue" | "red" | "green" | "yellow" | "night"; text: Record<StoryLanguage, StoryText> };

export const LANGUAGES: { code: StoryLanguage; label: string }[] = [
  { code: "hinglish", label: "Hinglish" },
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "English" },
];

export const STORY_UI: Record<StoryLanguage, { note: string; read: string; chapter: string }> = {
  hinglish: { note: "Yeh kaalpanik kahani hai, kisi real customer ka result nahi.", read: "Poori kahani padho", chapter: "Kahani" },
  hi: { note: "यह एक काल्पनिक कहानी है, किसी असली ग्राहक का नतीजा नहीं।", read: "पूरी कहानी पढ़ें", chapter: "कहानी" },
  en: { note: "This is a fictional story, not a real customer result.", read: "Read the full story", chapter: "Story" },
};

export const STORIES: Story[] = [
  {
    slug: "ramesh-kaka-ki-chai",
    tone: "blue",
    text: {
      hinglish: {
        trade: "Chai stall",
        title: "Ramesh Kaka ki chai",
        teaser: "22 saal se poora bazaar Kaka ki adrak wali chai jaanta tha. Bas Google nahi jaanta tha. Phir counter par ek chhota sa QR aaya.",
        paragraphs: [
          "Ramesh Kaka 22 saal se bazaar ke kone par chai bana rahe hain. Unki adrak wali chai aisi hai ki log office jaane se pehle roz rukte hain.",
          "Ek din shehar me ek naya ladka aaya. Usne phone par search kiya, “chai near me”. Kaka ka naam kahin nahi mila, par 400 reviews wala cafe sabse upar tha. Woh wahin chala gaya.",
          "Kaka ke purane customers kehte the, “Kaka, aapki chai sabse achhi hai.” Par Google par likhne ka time kisi ke paas nahi tha. Kai logon ko samajh hi nahi aata tha ki likhein kya.",
          "Phir counter par ek chhota sa QR lag gaya. Customer ne scan kiya, stars diye, do-teen cheezein chuni, aur apna review khud Google par post kiya. Jisko kami lagi, usne woh bhi likhi, aur Kaka ne apni chai aur behtar ki.",
          "Dheere dheere Google par bhi wahi dikhne laga jo bazaar pehle se jaanta tha. Ek subah wahi ladka reviews padhkar Kaka ki dukaan par aaya. Kaka muskuraye aur bole, “Beta, adrak zyada ya kam?”",
        ],
      },
      hi: {
        trade: "चाय की दुकान",
        title: "रमेश काका की चाय",
        teaser: "बाईस साल से पूरा बाज़ार काका की अदरक वाली चाय जानता था। बस Google नहीं जानता था। फिर काउंटर पर एक छोटा-सा QR आया।",
        paragraphs: [
          "रमेश काका बाईस साल से बाज़ार के कोने पर चाय बना रहे हैं। उनकी अदरक वाली चाय ऐसी है कि लोग दफ़्तर जाने से पहले रोज़ रुकते हैं।",
          "एक दिन शहर में एक नया लड़का आया। उसने फ़ोन पर खोजा, “पास में चाय”। काका का नाम कहीं नहीं मिला, पर 400 रिव्यू वाला कैफ़े सबसे ऊपर था। वह वहीं चला गया।",
          "काका के पुराने ग्राहक कहते थे, “काका, आपकी चाय सबसे अच्छी है।” पर Google पर लिखने का समय किसी के पास नहीं था। कई लोगों को समझ ही नहीं आता था कि लिखें क्या।",
          "फिर काउंटर पर एक छोटा-सा QR लग गया। ग्राहक ने स्कैन किया, स्टार दिए, दो-तीन बातें चुनीं और अपना रिव्यू खुद Google पर पोस्ट किया। जिसे कमी लगी, उसने वह भी लिखी, और काका ने अपनी चाय और बेहतर की।",
          "धीरे-धीरे Google पर भी वही दिखने लगा जो बाज़ार पहले से जानता था। एक सुबह वही लड़का रिव्यू पढ़कर काका की दुकान पर आया। काका मुस्कुराए और बोले, “बेटा, अदरक ज़्यादा या कम?”",
        ],
      },
      en: {
        trade: "Chai stall",
        title: "Ramesh Kaka's chai",
        teaser: "For 22 years, the whole market knew Kaka's ginger chai. Only Google did not. Then a small QR code appeared on the counter.",
        paragraphs: [
          "For 22 years, Ramesh Kaka has made chai at the corner of the market. His ginger chai is so good that people stop every morning on their way to work.",
          "One day, a young man new to the city searched his phone for “chai near me”. Kaka's name was nowhere. A cafe with 400 reviews was at the top, so he went there.",
          "Kaka's regulars always said, “Kaka, your chai is the best.” But nobody found time to write it on Google, and many simply did not know what to say.",
          "Then a small QR code appeared on the counter. Customers scanned it, chose their stars, tapped a few things they noticed, and posted their own review on Google. Those who found a flaw said so too, and Kaka made his chai even better.",
          "Slowly, Google began to show what the market already knew. One morning, that same young man read the reviews and walked up to Kaka's stall. Kaka smiled and asked, “More ginger or less, beta?”",
        ],
      },
    },
  },
  {
    slug: "sunita-ji-ka-parlour",
    tone: "red",
    text: {
      hinglish: {
        trade: "Beauty parlour",
        title: "Sunita ji ka parlour",
        teaser: "Unke haath ka kaam poori colony jaanti thi. Phir ek seedhe review ne unhe woh dikhaya jo koi muh par nahi bolta tha.",
        paragraphs: [
          "Sunita ji ka chhota sa parlour gali ke andar hai. Colony ki aadhi dulhanein unke haath se taiyaar hui hain, par gali ke bahar unhe koi nahi jaanta tha.",
          "Beti ne counter par QR lagwaya. Pehle hi hafte ek customer ne 3 stars diye aur likha, “Kaam badhiya hai, par wait bahut karna pada.” Sunita ji ko bura laga. Raat bhar sochti rahin.",
          "Agli subah unhone ek register nikala aur har customer ka time likhna shuru kiya. Ab kisi ko ghanta bhar baithna nahi padta.",
          "Kuch hafte baad wahi customer phir aayi. Jaate hue muskurakar boli, “Is baar to chai thandi hone se pehle number aa gaya.” Sunita ji ne us din samjha, seedhi baat bhi ek tohfa hoti hai.",
        ],
      },
      hi: {
        trade: "ब्यूटी पार्लर",
        title: "सुनीता जी का पार्लर",
        teaser: "उनके हाथ का काम पूरी कॉलोनी जानती थी। फिर एक सीधे रिव्यू ने उन्हें वह दिखाया जो कोई मुँह पर नहीं कहता था।",
        paragraphs: [
          "सुनीता जी का छोटा-सा पार्लर गली के अंदर है। कॉलोनी की आधी दुल्हनें उनके हाथ से तैयार हुई हैं, पर गली के बाहर उन्हें कोई नहीं जानता था।",
          "बेटी ने काउंटर पर QR लगवाया। पहले ही हफ़्ते एक ग्राहक ने 3 स्टार दिए और लिखा, “काम बढ़िया है, पर इंतज़ार बहुत करना पड़ा।” सुनीता जी को बुरा लगा। रात भर सोचती रहीं।",
          "अगली सुबह उन्होंने एक रजिस्टर निकाला और हर ग्राहक का समय लिखना शुरू किया। अब किसी को घंटा भर बैठना नहीं पड़ता।",
          "कुछ हफ़्ते बाद वही ग्राहक फिर आई। जाते हुए मुस्कुराकर बोली, “इस बार तो चाय ठंडी होने से पहले नंबर आ गया।” सुनीता जी ने उस दिन समझा, सीधी बात भी एक तोहफ़ा होती है।",
        ],
      },
      en: {
        trade: "Beauty parlour",
        title: "Sunita ji's parlour",
        teaser: "The whole colony knew her work. Then one honest review showed her what nobody would say to her face.",
        paragraphs: [
          "Sunita ji runs a small parlour deep inside a lane. Half the brides in the colony were dressed by her hands, but outside that lane, nobody knew her name.",
          "Her daughter put a QR code on the counter. In the first week, a customer gave 3 stars and wrote, “Lovely work, but I had to wait far too long.” It stung. Sunita ji lay awake thinking about it.",
          "The next morning she took out a register and began writing down a time for every customer. Nobody had to sit for an hour anymore.",
          "A few weeks later, the same customer returned. Leaving, she smiled and said, “This time my turn came before the chai went cold.” That day Sunita ji understood that plain truth can be a gift.",
        ],
      },
    },
  },
  {
    slug: "imran-bhai-ka-garage",
    tone: "green",
    text: {
      hinglish: {
        trade: "Bike garage",
        title: "Imran bhai ka garage",
        teaser: "Woh chahte to naya part bech dete. Unhone sirf ek dheeli wire kasi aur paise lene se mana kar diya. Yeh baat ek review tak pahunch gayi.",
        paragraphs: [
          "Imran bhai ka bike garage highway ke paas hai. Haath kaale rehte hain, par niyat saaf. Unka usool hai, jo kharab nahi hai use badlo mat.",
          "Ek raat ek ladki ki scooty band pad gayi. Doosri jagah use poora naya part bataya gaya tha. Imran bhai ne dekha, bas ek wire dheeli thi. Do minute me theek karke bole, “Iske kya paise lene.”",
          "Jaate hue usne counter ka QR scan kiya. Stars diye, do-teen cheezein chuni, aur apne words me poori baat likh di.",
          "Agle mahine ek anjaan aadmi apni purani bike lekar aaya. Bola, “Aapke baare me padha tha. Bas itna bata do, sach me kya kharab hai.” Imran bhai hanse aur spanner utha liya.",
        ],
      },
      hi: {
        trade: "बाइक गैराज",
        title: "इमरान भाई का गैराज",
        teaser: "वे चाहते तो नया पुर्ज़ा बेच देते। उन्होंने बस एक ढीली तार कसी और पैसे लेने से मना कर दिया। यह बात एक रिव्यू तक पहुँच गई।",
        paragraphs: [
          "इमरान भाई का बाइक गैराज हाईवे के पास है। हाथ काले रहते हैं, पर नीयत साफ़। उनका उसूल है, जो ख़राब नहीं है उसे बदलो मत।",
          "एक रात एक लड़की की स्कूटी बंद पड़ गई। दूसरी जगह उसे पूरा नया पुर्ज़ा बताया गया था। इमरान भाई ने देखा, बस एक तार ढीली थी। दो मिनट में ठीक करके बोले, “इसके क्या पैसे लेने।”",
          "जाते हुए उसने काउंटर का QR स्कैन किया। स्टार दिए, दो-तीन बातें चुनीं और अपने शब्दों में पूरी बात लिख दी।",
          "अगले महीने एक अनजान आदमी अपनी पुरानी बाइक लेकर आया। बोला, “आपके बारे में पढ़ा था। बस इतना बता दो, सच में क्या ख़राब है।” इमरान भाई हँसे और पाना उठा लिया।",
        ],
      },
      en: {
        trade: "Bike garage",
        title: "Imran bhai's garage",
        teaser: "He could have sold her a new part. He tightened one loose wire and refused to take money. That small thing found its way into a review.",
        paragraphs: [
          "Imran bhai's bike garage sits near the highway. His hands are always black with grease, but his intentions are clean. His rule is simple: if it isn't broken, don't replace it.",
          "One night, a young woman's scooter died. Another mechanic had told her she needed a whole new part. Imran bhai looked and found one loose wire. He fixed it in two minutes and said, “What's there to charge for?”",
          "On her way out, she scanned the QR on his counter, chose her stars, tapped a few things, and told the whole story in her own words.",
          "The next month, a stranger rolled in with an old bike. “I read about you,” he said. “Just tell me what's really wrong with it.” Imran bhai laughed and picked up his spanner.",
        ],
      },
    },
  },
  {
    slug: "meena-aunty-ki-mithai",
    tone: "yellow",
    text: {
      hinglish: {
        trade: "Sweet shop",
        title: "Meena Aunty ki mithai",
        teaser: "Naye shehar me Diwali thi aur ghar me ek bhi mithai nahi. Ek parivaar ne phone uthaya, aur raasta Aunty ki patli gali tak pahuncha.",
        paragraphs: [
          "Meena Aunty 30 saal se apne ghar ke neeche mithai bana rahi hain. Unke besan ke laddu ka swaad mohalle ke bachche bade hokar bhi yaad rakhte hain.",
          "Purane grahak har saal aate, par naye logon ko dukaan ka pata hi nahi chalta tha. Board chhota tha aur gali patli.",
          "Bete ne counter par QR rakh diya. Laddu lene aaye log jaate jaate do-teen taps me apni baat likhne lage. Kisi ne swaad likha, kisi ne safai, kisi ne Aunty ka pyaar.",
          "Us Diwali ek parivaar shehar me naya aaya. Unhone phone par reviews padhe aur patli gali dhoondhte hue pahunch gaye. Aunty ne pehla laddu haath me rakha aur boli, “Pehle muh meetha karo, paise baad me.”",
        ],
      },
      hi: {
        trade: "मिठाई की दुकान",
        title: "मीना आंटी की मिठाई",
        teaser: "नए शहर में दिवाली थी और घर में एक भी मिठाई नहीं। एक परिवार ने फ़ोन उठाया, और रास्ता आंटी की पतली गली तक पहुँचा।",
        paragraphs: [
          "मीना आंटी तीस साल से अपने घर के नीचे मिठाई बना रही हैं। उनके बेसन के लड्डू का स्वाद मोहल्ले के बच्चे बड़े होकर भी याद रखते हैं।",
          "पुराने ग्राहक हर साल आते, पर नए लोगों को दुकान का पता ही नहीं चलता था। बोर्ड छोटा था और गली पतली।",
          "बेटे ने काउंटर पर QR रख दिया। लड्डू लेने आए लोग जाते-जाते दो-तीन टैप में अपनी बात लिखने लगे। किसी ने स्वाद लिखा, किसी ने सफ़ाई, किसी ने आंटी का प्यार।",
          "उस दिवाली एक परिवार शहर में नया आया। उन्होंने फ़ोन पर रिव्यू पढ़े और पतली गली ढूँढते हुए पहुँच गए। आंटी ने पहला लड्डू हाथ में रखा और बोलीं, “पहले मुँह मीठा करो, पैसे बाद में।”",
        ],
      },
      en: {
        trade: "Sweet shop",
        title: "Meena Aunty's mithai",
        teaser: "It was Diwali in a new city, with not one sweet in the house. A family picked up a phone, and the trail led to Aunty's narrow lane.",
        paragraphs: [
          "For 30 years, Meena Aunty has made sweets in the shop below her home. Children from the neighbourhood grow up and still remember the taste of her besan laddoos.",
          "Her old customers came back every year, but newcomers never found the shop. The sign was small and the lane was narrow.",
          "Her son placed a QR code on the counter. People buying laddoos began leaving a few words on their way out. Some wrote about the taste, some the cleanliness, some Aunty's warmth.",
          "That Diwali, a family new to the city read those reviews on a phone and wandered down the narrow lane to find her. Aunty put the first laddoo in their hands and said, “Sweeten your mouth first. Money can wait.”",
        ],
      },
    },
  },
  {
    slug: "dr-kavya-ka-clinic",
    tone: "night",
    text: {
      hinglish: {
        trade: "Children's clinic",
        title: "Dr. Kavya ka clinic",
        teaser: "Bachche unse darte nahi, kyunki injection se pehle woh ek kahani sunati hain. Ek nayi maa ko yeh baat ek review se pata chali.",
        paragraphs: [
          "Dr. Kavya ka chhota sa clinic market ke upar pehli manzil par hai. Bachche unse darte nahi, kyunki injection se pehle woh ek kahani sunati hain.",
          "Clinic ke bahar koi bada board nahi tha. Jo aata, kisi ke kehne par aata. Naye log seedhe bade hospital chale jaate the.",
          "Reception par ek QR lag gaya. Log apni marzi se review dene lage. Kisi ne likha ki wait zyada tha, kisi ne likha ki doctor poori baat dhyan se sunti hain.",
          "Ek shaam ek nayi maa apne bukhar wale bachche ko lekar aayi. Boli, “Maine padha tha aap bachchon ko daraati nahi.” Dr. Kavya ne muskurakar bachche se pucha, “To aaj kaunsi kahani sunein?”",
        ],
      },
      hi: {
        trade: "बच्चों का क्लिनिक",
        title: "डॉ. काव्या का क्लिनिक",
        teaser: "बच्चे उनसे डरते नहीं, क्योंकि इंजेक्शन से पहले वे एक कहानी सुनाती हैं। एक नई माँ को यह बात एक रिव्यू से पता चली।",
        paragraphs: [
          "डॉ. काव्या का छोटा-सा क्लिनिक बाज़ार के ऊपर पहली मंज़िल पर है। बच्चे उनसे डरते नहीं, क्योंकि इंजेक्शन से पहले वे एक कहानी सुनाती हैं।",
          "क्लिनिक के बाहर कोई बड़ा बोर्ड नहीं था। जो आता, किसी के कहने पर आता। नए लोग सीधे बड़े अस्पताल चले जाते थे।",
          "रिसेप्शन पर एक QR लग गया। लोग अपनी मर्ज़ी से रिव्यू देने लगे। किसी ने लिखा कि इंतज़ार ज़्यादा था, किसी ने लिखा कि डॉक्टर पूरी बात ध्यान से सुनती हैं।",
          "एक शाम एक नई माँ अपने बुख़ार वाले बच्चे को लेकर आई। बोली, “मैंने पढ़ा था आप बच्चों को डराती नहीं।” डॉ. काव्या ने मुस्कुराकर बच्चे से पूछा, “तो आज कौन-सी कहानी सुनें?”",
        ],
      },
      en: {
        trade: "Children's clinic",
        title: "Dr. Kavya's clinic",
        teaser: "Children aren't afraid of her, because she tells a story before every injection. One new mother learned this from a review.",
        paragraphs: [
          "Dr. Kavya's small clinic is on the first floor above the market. Children aren't afraid of her, because she tells them a story before every injection.",
          "There was no big sign outside. Everyone who came had heard about her from someone. New families went straight to the large hospital instead.",
          "A QR code went up at reception. People began leaving reviews when they felt like it. Some said the wait was long. Others said the doctor truly listens.",
          "One evening, a new mother came in with her feverish child. “I read that you don't frighten children,” she said. Dr. Kavya smiled and asked the child, “So, which story shall we hear today?”",
        ],
      },
    },
  },
];

export function findStory(slug: string): Story | undefined {
  return STORIES.find((story) => story.slug === slug);
}
