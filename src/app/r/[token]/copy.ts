import type { ReviewLanguage } from "@/lib/ai/provider.interface";

export const COPY: Record<ReviewLanguage, {
  chooseLanguage: string; ratings: string[]; standOut: string; improve: string;
  pick: (min: number, max: number) => string; picked: (max: number) => string;
  yourReview: string; changeWording: string; update: string; editHint: string; staleHint: string;
  copyNext: string; copiedOpen: string; openGoogle: string;
  hintManual: string; hintCopied: string; hintReady: string; hintStart: string; hintMore: (count: number) => string;
  privateTitle: string; privateText: string; privateSent: string; privateLabel: string; privatePlaceholder: string;
  privateError: string; send: string; sending: string;
}> = {
  en: {
    chooseLanguage: "Choose your review language",
    ratings: ["", "Poor", "Below average", "Okay", "Good", "Excellent"],
    standOut: "What stood out?", improve: "What should improve?",
    pick: (min, max) => `Pick ${min} to ${max}`, picked: (max) => `You picked ${max}. Remove one to change it.`,
    yourReview: "Your review", changeWording: "Change wording", update: "Update",
    editHint: "Edit anything so it sounds like you.", staleHint: "Your choices changed. Tap Update to match them.",
    copyNext: "Copy & Next", copiedOpen: "Copied. Open Google", openGoogle: "Open Google",
    hintManual: "Copy the selected text, then paste it on Google.", hintCopied: "Copied. Paste it on Google and tap Post.",
    hintReady: "Google opens next. Paste your review and post it.", hintStart: "Tap a star to start.",
    hintMore: (count) => `Pick ${count} more to write your review.`,
    privateTitle: "Tell Semsorted privately",
    privateText: "The Semsorted team reads this. It is not posted on Google and does not replace your Google review.",
    privateSent: "Sent privately to the Semsorted team. You can still post your review on Google.",
    privateLabel: "Your private message", privatePlaceholder: "What went wrong?",
    privateError: "This did not send. Check your connection and try again.", send: "Send privately", sending: "Sending",
  },
  hi: {
    chooseLanguage: "रिव्यू की भाषा चुनें",
    ratings: ["", "खराब", "औसत से कम", "ठीक-ठाक", "अच्छा", "बहुत अच्छा"],
    standOut: "किन बातों पर लिखना है?", improve: "क्या बेहतर होना चाहिए?",
    pick: (min, max) => `${min} से ${max} चुनें`, picked: (max) => `आपने ${max} चुन लिए। बदलने के लिए एक हटाएँ।`,
    yourReview: "आपका रिव्यू", changeWording: "शब्द बदलें", update: "अपडेट करें",
    editHint: "इसे अपने शब्दों में बदल सकते हैं।", staleHint: "आपकी पसंद बदल गई। मिलाने के लिए अपडेट करें दबाएँ।",
    copyNext: "कॉपी करें और आगे बढ़ें", copiedOpen: "कॉपी हो गया, Google खोलें", openGoogle: "Google खोलें",
    hintManual: "चुना हुआ टेक्स्ट कॉपी करके Google पर पेस्ट करें।", hintCopied: "कॉपी हो गया। Google पर पेस्ट करके Post दबाएँ।",
    hintReady: "आगे Google खुलेगा। रिव्यू पेस्ट करके पोस्ट करें।", hintStart: "शुरू करने के लिए स्टार दबाएँ।",
    hintMore: (count) => `रिव्यू बनाने के लिए ${count} और चुनें।`,
    privateTitle: "Semsorted को निजी तौर पर बताएँ",
    privateText: "इसे Semsorted की टीम पढ़ती है। यह Google पर पोस्ट नहीं होता और आपके Google रिव्यू की जगह नहीं लेता।",
    privateSent: "Semsorted की टीम को निजी तौर पर भेज दिया। आप अब भी Google पर रिव्यू पोस्ट कर सकते हैं।",
    privateLabel: "आपका निजी संदेश", privatePlaceholder: "क्या दिक्कत हुई?",
    privateError: "यह नहीं भेजा जा सका। इंटरनेट देखकर फिर कोशिश करें।", send: "निजी रूप से भेजें", sending: "भेज रहे हैं",
  },
  hinglish: {
    chooseLanguage: "Review ki language chunein",
    ratings: ["", "Kharab", "Average se kam", "Theek-thaak", "Accha", "Bahut accha"],
    standOut: "Kin baaton par likhna hai?", improve: "Kya behtar hona chahiye?",
    pick: (min, max) => `${min} se ${max} chunein`, picked: (max) => `Aapne ${max} chun liye. Badalne ke liye ek hatayein.`,
    yourReview: "Aapka review", changeWording: "Wording badlein", update: "Update karein",
    editHint: "Ise apne words me badal sakte hain.", staleHint: "Aapki choice badal gayi. Match karne ke liye Update karein dabayein.",
    copyNext: "Copy karke aage badhein", copiedOpen: "Copy ho gaya, Google kholein", openGoogle: "Google kholein",
    hintManual: "Selected text copy karke Google par paste karein.", hintCopied: "Copy ho gaya. Google par paste karke Post dabayein.",
    hintReady: "Aage Google khulega. Review paste karke post karein.", hintStart: "Shuru karne ke liye star dabayein.",
    hintMore: (count) => `Review banane ke liye ${count} aur chunein.`,
    privateTitle: "Semsorted ko private me batayein",
    privateText: "Ise Semsorted ki team padhti hai. Yeh Google par post nahi hota aur aapke Google review ki jagah nahi leta.",
    privateSent: "Semsorted ki team ko private me bhej diya. Aap ab bhi Google par review post kar sakte hain.",
    privateLabel: "Aapka private message", privatePlaceholder: "Kya dikkat hui?",
    privateError: "Yeh send nahi hua. Internet check karke dobara try karein.", send: "Private me bhejein", sending: "Bhej rahe hain",
  },
};
