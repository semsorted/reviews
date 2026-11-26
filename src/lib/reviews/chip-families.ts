import type { ReviewLanguage } from "@/lib/ai/provider.interface";

type PersonLine = (person: string) => string;
export type ChipFamily = {
  /** Names the chip is shown under, one per day. The first is the usual name. */
  names: string[];
  /** Whole sentences for a 4 or 5 star review, so the chip reads naturally instead of "I liked the hesitation". */
  good: Record<ReviewLanguage, string[]>;
  /** Picked with a person chip ("B.L. Sir") at 4 or 5 stars: the person gets the credit in one sentence. */
  person?: Record<ReviewLanguage, PersonLine[]>;
  /** The chip as a topic in the 1 to 3 star templates, when its own label reads badly there. */
  topic?: Partial<Record<ReviewLanguage, string>>;
};

const CONFIDENCE: ChipFamily = {
  names: ["Confidence building", "Confidence", "Self-confidence", "Confidence boost"],
  good: {
    en: ["My confidence has grown a lot since joining.", "I feel far more confident speaking English now.", "The classes really helped build my confidence.", "My self-confidence is much better than before."],
    hinglish: ["Join karne ke baad mera confidence kaafi badha.", "Ab English bolte waqt confidence kaafi zyada rehta hai.", "Classes se mera confidence achha khasa build hua.", "Pehle se kaafi zyada self-confidence aa gaya hai."],
    hi: ["यहाँ आने के बाद मेरा आत्मविश्वास काफ़ी बढ़ा।", "अब अंग्रेज़ी बोलते समय आत्मविश्वास कहीं ज़्यादा रहता है।", "क्लासेज़ से मेरा आत्मविश्वास अच्छा-ख़ासा बढ़ा।", "पहले के मुक़ाबले अब ख़ुद पर ज़्यादा भरोसा है।"],
  },
  person: {
    en: [(p) => `${p} really helped me build my confidence.`, (p) => `${p} helped me a lot in building my confidence.`, (p) => `Thanks to ${p}, I feel much more confident now.`, (p) => `${p} gave me the confidence to speak freely.`],
    hinglish: [(p) => `${p} ne mera confidence build karne me kaafi help ki.`, (p) => `${p} ki wajah se mera confidence kaafi badha.`, (p) => `${p} ne mujhe khulkar bolne ka confidence diya.`, (p) => `${p} ki guidance se confidence pehle se kaafi better hai.`],
    hi: [(p) => `${p} ने मेरा आत्मविश्वास बढ़ाने में काफ़ी मदद की।`, (p) => `${p} की वजह से मेरा आत्मविश्वास काफ़ी बढ़ा।`, (p) => `${p} ने मुझे खुलकर बोलने का आत्मविश्वास दिया।`, (p) => `${p} के मार्गदर्शन से आत्मविश्वास पहले से काफ़ी बेहतर है।`],
  },
};

const FAMILIES: Record<string, ChipFamily> = {
  "confidence building": CONFIDENCE,
  confidence: { ...CONFIDENCE, names: ["Confidence", "Self-confidence", "Confidence boost", "Confidence building"] },
  hesitation: {
    names: ["Hesitation", "No more hesitation", "Speaking without hesitation"],
    good: {
      en: ["My hesitation in speaking English is mostly gone.", "I no longer hesitate before speaking in English.", "The classes helped me get over my hesitation.", "Speaking English without hesitation feels natural now."],
      hinglish: ["English bolne me jo jhijhak thi, wo kaafi had tak khatam ho gayi.", "Ab English bolne se pehle hesitation nahi hoti.", "Classes ki wajah se meri hesitation door hui.", "Ab bina jhijhak English bolna aasaan lagta hai."],
      hi: ["अंग्रेज़ी बोलने में जो झिझक थी, वह काफ़ी हद तक दूर हो गई।", "अब अंग्रेज़ी बोलने से पहले झिझक नहीं होती।", "क्लासेज़ की वजह से मेरी झिझक दूर हुई।", "अब बिना झिझक अंग्रेज़ी बोलना आसान लगता है।"],
    },
    person: {
      en: [(p) => `${p} helped me get rid of my hesitation in speaking.`, (p) => `${p} made speaking English feel easy, without any hesitation.`, (p) => `Thanks to ${p}, I no longer hesitate to speak English.`, (p) => `${p} patiently helped me overcome my hesitation.`],
      hinglish: [(p) => `${p} ne meri bolne ki jhijhak door ki.`, (p) => `${p} ki wajah se ab English bolne me hesitation nahi hoti.`, (p) => `${p} ne dhairya se meri hesitation khatam karwayi.`, (p) => `${p} ki help se bolne ki jhijhak chali gayi.`],
      hi: [(p) => `${p} ने मेरी बोलने की झिझक दूर की।`, (p) => `${p} की वजह से अब अंग्रेज़ी बोलने में झिझक नहीं होती।`, (p) => `${p} ने धैर्य से मेरी झिझक ख़त्म करवाई।`, (p) => `${p} की मदद से बोलने की झिझक चली गई।`],
    },
    topic: { en: "work on hesitation", hinglish: "hesitation par kaam", hi: "झिझक दूर करने पर काम" },
  },
  "public speaking": {
    names: ["Public speaking", "Stage confidence", "Speaking in front of people"],
    good: {
      en: ["Speaking in front of a group feels much easier now.", "The public speaking practice made a real difference.", "Standing up and speaking in front of others is no longer scary.", "My stage confidence has improved a lot."],
      hinglish: ["Ab logon ke saamne bolna kaafi aasaan lagta hai.", "Public speaking ki practice se kaafi fark pada.", "Ab sabke saamne khade hokar bolne me dar nahi lagta.", "Stage par bolne ka confidence kaafi improve hua."],
      hi: ["अब लोगों के सामने बोलना काफ़ी आसान लगता है।", "पब्लिक स्पीकिंग की प्रैक्टिस से काफ़ी फ़र्क़ पड़ा।", "अब सबके सामने खड़े होकर बोलने में डर नहीं लगता।", "मंच पर बोलने का आत्मविश्वास काफ़ी बढ़ा।"],
    },
    person: {
      en: [(p) => `${p} helped me speak confidently in front of people.`, (p) => `${p} worked a lot on my public speaking.`, (p) => `Thanks to ${p}, speaking on stage no longer feels scary.`, (p) => `${p} prepared me well for speaking in front of a group.`],
      hinglish: [(p) => `${p} ne logon ke saamne bolna sikhaya.`, (p) => `${p} ne meri public speaking par kaafi kaam kiya.`, (p) => `${p} ki wajah se ab stage par bolne me dar nahi lagta.`, (p) => `${p} ne group ke saamne bolne ki achhi taiyari karwayi.`],
      hi: [(p) => `${p} ने लोगों के सामने बोलना सिखाया।`, (p) => `${p} ने मेरी पब्लिक स्पीकिंग पर काफ़ी काम किया।`, (p) => `${p} की वजह से अब मंच पर बोलने में डर नहीं लगता।`, (p) => `${p} ने ग्रुप के सामने बोलने की अच्छी तैयारी करवाई।`],
    },
    topic: { en: "public speaking practice", hinglish: "public speaking practice", hi: "पब्लिक स्पीकिंग की प्रैक्टिस" },
  },
  fluency: {
    names: ["Fluency", "Fluent English", "Speaking fluently"],
    good: {
      en: ["My fluency in English has improved a lot.", "I can now speak English much more fluently.", "Sentences come out much more smoothly now.", "The focus on fluency really worked for me."],
      hinglish: ["Meri English fluency me kaafi improvement aaya.", "Ab English me baat karna kaafi smooth ho gaya hai.", "Ab sentences bina ruke aaram se ban jaate hain.", "Fluency par jo focus tha, wo kaafi kaam aaya."],
      hi: ["मेरी अंग्रेज़ी की रवानी में काफ़ी सुधार आया।", "अब अंग्रेज़ी में बात करना काफ़ी सहज हो गया है।", "अब वाक्य बिना रुके आराम से बन जाते हैं।", "फ़्लुएंसी पर जो ध्यान दिया गया, वह काफ़ी काम आया।"],
    },
  },
  pronunciation: {
    names: ["Pronunciation", "Correct pronunciation", "Clear pronunciation"],
    good: {
      en: ["My pronunciation is much clearer now.", "They paid close attention to correct pronunciation.", "Pronunciation mistakes were corrected patiently.", "I learned to pronounce words the right way."],
      hinglish: ["Meri pronunciation pehle se kaafi clear ho gayi hai.", "Sahi pronunciation par kaafi dhyan diya jaata hai.", "Pronunciation ki galtiyan dhairya se sudhaari gayin.", "Words ko sahi tarah bolna seekhne ko mila."],
      hi: ["मेरा उच्चारण पहले से काफ़ी साफ़ हो गया है।", "सही उच्चारण पर काफ़ी ध्यान दिया जाता है।", "उच्चारण की ग़लतियाँ धैर्य से सुधारी गईं।", "शब्दों को सही तरह बोलना सीखने को मिला।"],
    },
  },
  "speaking practice": {
    names: ["Speaking practice", "Daily speaking practice", "Conversation practice"],
    good: {
      en: ["There was plenty of speaking practice in every class.", "The daily speaking practice helped a lot.", "Regular conversation practice made a big difference.", "We got enough chances to actually speak in class."],
      hinglish: ["Har class me bolne ki kaafi practice hoti hai.", "Daily speaking practice se kaafi help mili.", "Regular conversation practice se bahut fark pada.", "Class me khud bolne ke kaafi mauke milte hain."],
      hi: ["हर क्लास में बोलने की काफ़ी प्रैक्टिस होती है।", "रोज़ की स्पीकिंग प्रैक्टिस से काफ़ी मदद मिली।", "नियमित बातचीत की प्रैक्टिस से बहुत फ़र्क़ पड़ा।", "क्लास में ख़ुद बोलने के काफ़ी मौक़े मिलते हैं।"],
    },
  },
  "group discussion": {
    names: ["Group discussion", "GD practice", "Group activities"],
    good: {
      en: ["The group discussions were really useful.", "GD sessions helped me put my thoughts into words.", "Group activities made the classes lively.", "Taking part in group discussions built my confidence."],
      hinglish: ["Group discussions kaafi useful rahe.", "GD sessions se apni baat rakhna seekhne ko mila.", "Group activities se classes kaafi interesting rehti hain.", "Group discussion me hissa lene se confidence badha."],
      hi: ["ग्रुप डिस्कशन काफ़ी काम के रहे।", "जीडी सेशन से अपनी बात रखना सीखने को मिला।", "ग्रुप एक्टिविटी से क्लासेज़ काफ़ी दिलचस्प रहती हैं।", "ग्रुप डिस्कशन में हिस्सा लेने से आत्मविश्वास बढ़ा।"],
    },
  },
  "interview preparation": {
    names: ["Interview preparation", "Interview practice", "Mock interviews"],
    good: {
      en: ["The interview preparation was very practical.", "Mock interviews helped me prepare well.", "I learned how to answer interview questions with confidence.", "The interview practice sessions were really helpful."],
      hinglish: ["Interview preparation kaafi practical rahi.", "Mock interviews se achhi taiyari ho payi.", "Interview ke sawaalon ke jawab confidence se dena seekha.", "Interview practice sessions kaafi helpful rahe."],
      hi: ["इंटरव्यू की तैयारी काफ़ी व्यावहारिक रही।", "मॉक इंटरव्यू से अच्छी तैयारी हो पाई।", "इंटरव्यू के सवालों के जवाब आत्मविश्वास से देना सीखा।", "इंटरव्यू प्रैक्टिस सेशन काफ़ी मददगार रहे।"],
    },
  },
  grammar: {
    names: ["Grammar", "Grammar basics", "Clear grammar"],
    good: {
      en: ["Grammar was explained in a simple, clear way.", "My grammar mistakes have reduced a lot.", "The grammar basics are much clearer to me now.", "Grammar never felt boring here."],
      hinglish: ["Grammar bahut simple aur clear tareeke se samjhayi gayi.", "Meri grammar ki galtiyan kaafi kam ho gayi hain.", "Grammar ke basics ab kaafi clear hain.", "Yahan grammar kabhi boring nahi lagi."],
      hi: ["ग्रामर बहुत आसान और साफ़ तरीक़े से समझाई गई।", "मेरी ग्रामर की ग़लतियाँ काफ़ी कम हो गई हैं।", "ग्रामर की बुनियादी बातें अब काफ़ी साफ़ हैं।", "यहाँ ग्रामर कभी बोरिंग नहीं लगी।"],
    },
  },
  vocabulary: {
    names: ["Vocabulary", "New words", "Word power"],
    good: {
      en: ["My vocabulary has grown a lot.", "I learned many new words that I actually use.", "The focus on vocabulary was really helpful.", "Using the right words feels much easier now."],
      hinglish: ["Meri vocabulary kaafi badh gayi hai.", "Kaafi naye words seekhe jo roz kaam aate hain.", "Vocabulary par focus kaafi helpful raha.", "Ab sahi words chunna kaafi aasaan lagta hai."],
      hi: ["मेरी शब्दावली काफ़ी बढ़ गई है।", "कई नए शब्द सीखे जो रोज़ काम आते हैं।", "शब्दावली पर ध्यान देना काफ़ी मददगार रहा।", "अब सही शब्द चुनना काफ़ी आसान लगता है।"],
    },
  },
  "teaching method": {
    names: ["Teaching method", "Teaching style", "Way of teaching"],
    good: {
      en: ["The teaching method is simple and easy to follow.", "I really liked the teaching style here.", "Every topic is taught in an easy, practical way.", "The way of teaching keeps the classes interesting."],
      hinglish: ["Padhane ka tareeka simple aur samajhne me aasaan hai.", "Yahan ka teaching style mujhe kaafi pasand aaya.", "Har topic aasaan aur practical tareeke se padhaya jaata hai.", "Padhane ka tareeka classes ko interesting banaye rakhta hai."],
      hi: ["पढ़ाने का तरीक़ा आसान और समझने लायक है।", "यहाँ का पढ़ाने का अंदाज़ मुझे काफ़ी पसंद आया।", "हर टॉपिक आसान और व्यावहारिक तरीक़े से पढ़ाया जाता है।", "पढ़ाने का तरीक़ा क्लासेज़ को दिलचस्प बनाए रखता है।"],
    },
  },
  "doubt clearing": {
    names: ["Doubt clearing", "Doubt solving", "Clearing doubts"],
    good: {
      en: ["Every doubt was cleared patiently.", "Asking questions in class always felt easy.", "Doubts were solved quickly and clearly.", "No question was ever ignored."],
      hinglish: ["Har doubt dhairya se clear kiya gaya.", "Class me sawaal poochhna hamesha aasaan laga.", "Doubts jaldi aur clearly solve hote hain.", "Kisi bhi sawaal ko kabhi ignore nahi kiya gaya."],
      hi: ["हर डाउट धैर्य से दूर किया गया।", "क्लास में सवाल पूछना हमेशा आसान लगा।", "डाउट जल्दी और साफ़ तरीक़े से सुलझाए जाते हैं।", "किसी भी सवाल को कभी नज़रअंदाज़ नहीं किया गया।"],
    },
  },
  "personal attention": {
    names: ["Personal attention", "Individual attention", "One-on-one attention"],
    good: {
      en: ["Every student gets personal attention.", "I got individual attention whenever I needed it.", "They notice where each student needs help.", "The one-on-one attention made a big difference."],
      hinglish: ["Har student par personal dhyan diya jaata hai.", "Jab bhi zarurat padi, individual attention mila.", "Kis student ko kahan help chahiye, iska dhyan rakha jaata hai.", "One-on-one attention se kaafi fark pada."],
      hi: ["हर स्टूडेंट पर व्यक्तिगत ध्यान दिया जाता है।", "जब भी ज़रूरत पड़ी, अलग से ध्यान मिला।", "किस स्टूडेंट को कहाँ मदद चाहिए, इसका ध्यान रखा जाता है।", "व्यक्तिगत ध्यान से काफ़ी फ़र्क़ पड़ा।"],
    },
  },
  "course material": {
    names: ["Course material", "Study material", "Notes and material"],
    good: {
      en: ["The course material is clear and well organised.", "The study material was easy to follow.", "The notes were really useful for practice.", "The material covers everything needed."],
      hinglish: ["Course material clear aur well organised hai.", "Study material samajhne me aasaan raha.", "Notes practice ke liye kaafi useful rahe.", "Material me zaruri sab kuch cover hai."],
      hi: ["कोर्स मटीरियल साफ़ और व्यवस्थित है।", "स्टडी मटीरियल समझने में आसान रहा।", "नोट्स प्रैक्टिस के लिए काफ़ी काम के रहे।", "मटीरियल में ज़रूरी सब कुछ शामिल है।"],
    },
  },
  "batch size": {
    names: ["Batch size", "Small batches", "Batch strength"],
    good: {
      en: ["The batches are small, so everyone gets a chance to speak.", "The batch size is just right.", "Small batches meant more time for each student.", "With a small batch, the classes felt personal."],
      hinglish: ["Batches chhote hain, isliye sabko bolne ka mauka milta hai.", "Batch size bilkul sahi hai.", "Chhote batch ki wajah se har student ko zyada time milta hai.", "Chhote batch me classes kaafi personal lagti hain."],
      hi: ["बैच छोटे हैं, इसलिए सबको बोलने का मौक़ा मिलता है।", "बैच का साइज़ बिल्कुल सही है।", "छोटे बैच की वजह से हर स्टूडेंट को ज़्यादा समय मिलता है।", "छोटे बैच में क्लासेज़ काफ़ी व्यक्तिगत लगती हैं।"],
    },
  },
  batchmates: {
    names: ["Batchmates", "Classmates", "Peer group"],
    good: {
      en: ["The batchmates were friendly and supportive.", "Practising with classmates made learning fun.", "I had a good peer group to practise with.", "Everyone in the batch helped each other improve."],
      hinglish: ["Batchmates friendly aur supportive rahe.", "Classmates ke saath practice karke seekhna mazedaar raha.", "Practice ke liye achha peer group mila.", "Batch me sab ek-doosre ko improve karne me help karte hain."],
      hi: ["बैचमेट्स मिलनसार और मददगार रहे।", "क्लासमेट्स के साथ प्रैक्टिस करके सीखना मज़ेदार रहा।", "प्रैक्टिस के लिए अच्छा ग्रुप मिला।", "बैच में सब एक-दूसरे को बेहतर बनाने में मदद करते हैं।"],
    },
  },
  "classroom environment": {
    names: ["Classroom environment", "Learning environment", "Class atmosphere"],
    good: {
      en: ["The classroom environment is positive and friendly.", "The learning environment made it easy to speak up.", "The atmosphere in class is relaxed and encouraging.", "Nobody laughs at mistakes here, which helps a lot."],
      hinglish: ["Class ka mahaul positive aur friendly hai.", "Yahan ke mahaul me khulkar bolna aasaan laga.", "Class ka atmosphere relaxed aur encouraging rehta hai.", "Yahan galtiyon par koi hansta nahi, isse kaafi help milti hai."],
      hi: ["क्लास का माहौल सकारात्मक और दोस्ताना है।", "यहाँ के माहौल में खुलकर बोलना आसान लगा।", "क्लास का माहौल सहज और हौसला बढ़ाने वाला रहता है।", "यहाँ ग़लतियों पर कोई हँसता नहीं, इससे काफ़ी मदद मिलती है।"],
    },
  },
  timings: {
    names: ["Timings", "Flexible timings", "Class timings"],
    good: {
      en: ["The class timings were convenient.", "Flexible timings made it easy to attend regularly.", "The batch timings fit well with my schedule.", "Classes always start on time."],
      hinglish: ["Class ki timings convenient rahi.", "Flexible timings ki wajah se regular aana aasaan raha.", "Batch ki timing mere schedule me achhe se fit hui.", "Classes hamesha time par shuru hoti hain."],
      hi: ["क्लास का समय सुविधाजनक रहा।", "समय लचीला होने से नियमित आना आसान रहा।", "बैच का समय मेरे शेड्यूल में अच्छे से बैठ गया।", "क्लासेज़ हमेशा समय पर शुरू होती हैं।"],
    },
  },
  "regular classes": {
    names: ["Regular classes", "Punctual classes", "No missed classes"],
    good: {
      en: ["Classes are held regularly without breaks.", "The classes are punctual and well planned.", "Classes were rarely missed or cancelled.", "The regular schedule kept my practice on track."],
      hinglish: ["Classes bina break ke regular hoti hain.", "Classes punctual aur achhe se planned hoti hain.", "Classes shayad hi kabhi cancel hui.", "Regular schedule se practice track par rahi."],
      hi: ["क्लासेज़ बिना रुकावट नियमित होती हैं।", "क्लासेज़ समय पर और अच्छी योजना से होती हैं।", "क्लासेज़ शायद ही कभी रद्द हुईं।", "नियमित शेड्यूल से प्रैक्टिस सही रास्ते पर रही।"],
    },
    topic: { en: "regularity of classes", hinglish: "classes ki regularity", hi: "क्लास की नियमितता" },
  },
  fees: {
    names: ["Fees", "Affordable fees", "Fee structure"],
    good: {
      en: ["The fees are reasonable for what is taught.", "The course felt like good value for money.", "The fee structure is clear, with no hidden charges.", "Quality coaching at an affordable fee."],
      hinglish: ["Jo padhaya jaata hai, uske hisaab se fees reasonable hai.", "Course paisa vasool laga.", "Fee structure clear hai, koi hidden charge nahi.", "Affordable fees me quality coaching milti hai."],
      hi: ["जो पढ़ाया जाता है, उसके हिसाब से फ़ीस वाजिब है।", "कोर्स पैसा वसूल लगा।", "फ़ीस का ढांचा साफ़ है, कोई छिपा चार्ज नहीं।", "किफ़ायती फ़ीस में अच्छी कोचिंग मिलती है।"],
    },
  },
  results: {
    names: ["Results", "Visible improvement", "Real progress"],
    good: {
      en: ["I could see real results within a few weeks.", "The improvement in my English is clearly visible.", "The course delivered real, practical results.", "My progress has been steady and clear."],
      hinglish: ["Kuch hi hafton me asli results dikhne lage.", "Meri English me improvement saaf dikhta hai.", "Course se asli aur practical results mile.", "Meri progress lagataar aur saaf rahi."],
      hi: ["कुछ ही हफ़्तों में असली नतीजे दिखने लगे।", "मेरी अंग्रेज़ी में सुधार साफ़ दिखता है।", "कोर्स से असली और व्यावहारिक नतीजे मिले।", "मेरी प्रगति लगातार और साफ़ रही।"],
    },
  },
  "progress tracking": {
    names: ["Progress tracking", "Regular feedback", "Progress checks"],
    good: {
      en: ["My progress was tracked regularly.", "Regular feedback showed me where to improve.", "Progress checks kept me motivated.", "It was always clear how much I had improved."],
      hinglish: ["Meri progress par regular nazar rakhi gayi.", "Regular feedback se pata chala ki kahan improve karna hai.", "Progress checks se motivation bana raha.", "Kitna improvement hua, ye hamesha clear rehta hai."],
      hi: ["मेरी प्रगति पर नियमित नज़र रखी गई।", "नियमित फ़ीडबैक से पता चला कि कहाँ सुधार करना है।", "प्रोग्रेस चेक से हौसला बना रहा।", "कितना सुधार हुआ, यह हमेशा साफ़ रहता है।"],
    },
  },
  "friendly staff": {
    names: ["Friendly staff", "Helpful staff", "Staff support"],
    good: {
      en: ["The staff are friendly and helpful.", "The staff always helped with any query.", "Everyone at the front desk was polite.", "The support staff made everything easy."],
      hinglish: ["Staff friendly aur helpful hai.", "Kisi bhi query me staff ne hamesha help ki.", "Front desk par sab polite rahe.", "Support staff ne sab kuch aasaan bana diya."],
      hi: ["स्टाफ़ मिलनसार और मददगार है।", "किसी भी सवाल में स्टाफ़ ने हमेशा मदद की।", "फ़्रंट डेस्क पर सब विनम्र रहे।", "सपोर्ट स्टाफ़ ने सब कुछ आसान बना दिया।"],
    },
    topic: { en: "staff behaviour", hinglish: "staff ka behaviour", hi: "स्टाफ़ का व्यवहार" },
  },
};

/** Null for a chip the admin typed that has no family, so the plain templates are used. */
export const chipFamily = (label: string): ChipFamily | null => FAMILIES[label.trim().toLowerCase()] ?? null;

export const allChipFamilies = () => Object.entries(FAMILIES);
