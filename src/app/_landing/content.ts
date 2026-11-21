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

export const STORY: Record<StoryLanguage, { tab: string; title: string; paragraphs: string[]; note: string }> = {
  hinglish: {
    tab: "Hinglish",
    title: "Ramesh Kaka ki chai",
    paragraphs: [
      "Ramesh Kaka 22 saal se bazaar ke kone par chai bana rahe hain. Unki adrak wali chai aisi hai ki log office jaane se pehle roz rukte hain.",
      "Ek din shehar me ek naya ladka aaya. Usne phone par search kiya, “chai near me”. Kaka ka naam kahin nahi mila, par 400 reviews wala cafe sabse upar tha. Woh wahin chala gaya.",
      "Kaka ke purane customers kehte the, “Kaka, aapki chai sabse achhi hai.” Par Google par likhne ka time kisi ke paas nahi tha. Kai logon ko samajh hi nahi aata tha ki likhein kya.",
      "Phir counter par ek chhota sa QR lag gaya. Customer ne scan kiya, stars diye, do-teen cheezein chuni, aur apna review khud Google par post kiya. Jisko kami lagi, usne woh bhi likhi, aur Kaka ne apni chai aur behtar ki.",
      "Dheere dheere Google par bhi wahi dikhne laga jo bazaar pehle se jaanta tha. Ek subah wahi ladka reviews padhkar Kaka ki dukaan par aaya. Kaka muskuraye aur bole, “Beta, adrak zyada ya kam?”",
    ],
    note: "Yeh ek kaalpanik kahani hai, kisi real customer ka result nahi.",
  },
  hi: {
    tab: "हिंदी",
    title: "रमेश काका की चाय",
    paragraphs: [
      "रमेश काका बाईस साल से बाज़ार के कोने पर चाय बना रहे हैं। उनकी अदरक वाली चाय ऐसी है कि लोग दफ़्तर जाने से पहले रोज़ रुकते हैं।",
      "एक दिन शहर में एक नया लड़का आया। उसने फ़ोन पर खोजा, “पास में चाय”। काका का नाम कहीं नहीं मिला, पर 400 रिव्यू वाला कैफ़े सबसे ऊपर था। वह वहीं चला गया।",
      "काका के पुराने ग्राहक कहते थे, “काका, आपकी चाय सबसे अच्छी है।” पर Google पर लिखने का समय किसी के पास नहीं था। कई लोगों को समझ ही नहीं आता था कि लिखें क्या।",
      "फिर काउंटर पर एक छोटा-सा QR लग गया। ग्राहक ने स्कैन किया, स्टार दिए, दो-तीन बातें चुनीं और अपना रिव्यू खुद Google पर पोस्ट किया। जिसे कमी लगी, उसने वह भी लिखी, और काका ने अपनी चाय और बेहतर की।",
      "धीरे-धीरे Google पर भी वही दिखने लगा जो बाज़ार पहले से जानता था। एक सुबह वही लड़का रिव्यू पढ़कर काका की दुकान पर आया। काका मुस्कुराए और बोले, “बेटा, अदरक ज़्यादा या कम?”",
    ],
    note: "यह एक काल्पनिक कहानी है, किसी असली ग्राहक का नतीजा नहीं।",
  },
  en: {
    tab: "English",
    title: "Ramesh Kaka's chai",
    paragraphs: [
      "For 22 years, Ramesh Kaka has made chai at the corner of the market. His ginger chai is so good that people stop every morning on their way to work.",
      "One day, a young man new to the city searched his phone for “chai near me”. Kaka's name was nowhere. A cafe with 400 reviews was at the top, so he went there.",
      "Kaka's regulars always said, “Kaka, your chai is the best.” But nobody found time to write it on Google, and many simply did not know what to say.",
      "Then a small QR code appeared on the counter. Customers scanned it, chose their stars, tapped a few things they noticed, and posted their own review on Google. Those who found a flaw said so too, and Kaka made his chai even better.",
      "Slowly, Google began to show what the market already knew. One morning, that same young man read the reviews and walked up to Kaka's stall. Kaka smiled and asked, “More ginger or less, beta?”",
    ],
    note: "This is a fictional story, not a real customer result.",
  },
};
