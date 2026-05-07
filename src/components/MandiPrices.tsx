import React, { useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SupportedLanguage } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type MandiRecord = {
  state: string;
  market: string;
  commodity: string;
  arrivalDate: string;
  minPriceFormatted: string;
  maxPriceFormatted: string;
  modalPriceFormatted: string;
};

type TrendPoint = {
  date: string;
  modalPrice: number;
};

type ApiResponse = {
  records: MandiRecord[];
  states: string[];
  commodities: string[];
  trend: TrendPoint[];
};

const languageLocaleMap: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
};

const languageDigitsMap: Record<SupportedLanguage, string[]> = {
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  ta: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'],
  te: ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'],
  kn: ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'],
  ml: ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯'],
  or: ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'],
};

const mandiStateTranslations: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'Andhra Pradesh': { hi: 'आंध्र प्रदेश', ta: 'ஆந்திரப் பிரதேசம்', te: 'ఆంధ్ర ప్రదేశ్', kn: 'ಆಂಧ್ರ ಪ್ರದೇಶ', ml: 'ആന്ധ്ര പ്രദേശ്', or: 'ଆନ୍ଧ୍ର ପ୍ରଦେଶ' },
  'Arunachal Pradesh': { hi: 'अरुणाचल प्रदेश', ta: 'அருணாசலப் பிரதேசம்', te: 'అరుణాచల్ ప్రదేశ్', kn: 'ಅರುಣಾಚಲ ಪ್ರದೇಶ', ml: 'അരുണാചൽ പ്രദേശ്', or: 'ଅରୁଣାଚଳ ପ୍ରଦେଶ' },
  Assam: { hi: 'असम', ta: 'அசாம்', te: 'అస్సాం', kn: 'ಅಸ್ಸಾಂ', ml: 'അസം', or: 'ଆସାମ' },
  Bihar: { hi: 'बिहार', ta: 'பீகார்', te: 'బీహార్', kn: 'ಬಿಹಾರ', ml: 'ബിഹാർ', or: 'ବିହାର' },
  Chhattisgarh: { hi: 'छत्तीसगढ़', ta: 'சத்தீஸ்கர்', te: 'ఛత్తీస్‌గఢ్', kn: 'ಛತ್ತೀಸ್‌ಗಢ', ml: 'ഛത്തീസ്ഗഢ്', or: 'ଛତ୍ତିଶଗଡ଼' },
  Goa: { hi: 'गोवा', ta: 'கோவா', te: 'గోవా', kn: 'ಗೋವಾ', ml: 'ഗോവ', or: 'ଗୋଆ' },
  Gujarat: { hi: 'गुजरात', ta: 'குஜராத்', te: 'గుజరాత్', kn: 'ಗುಜರಾತ್', ml: 'ഗുജറാത്ത്', or: 'ଗୁଜରାଟ' },
  Haryana: { hi: 'हरियाणा', ta: 'ஹரியானா', te: 'హర్యానా', kn: 'ಹರಿಯಾಣ', ml: 'ഹരിയാന', or: 'ହରିୟାଣା' },
  'Himachal Pradesh': { hi: 'हिमाचल प्रदेश', ta: 'ஹிமாச்சலப் பிரதேசம்', te: 'హిమాచల్ ప్రదేశ్', kn: 'ಹಿಮಾಚಲ ಪ್ರದೇಶ', ml: 'ഹിമാചൽ പ്രദേശ്', or: 'ହିମାଚଳ ପ୍ରଦେଶ' },
  Jharkhand: { hi: 'झारखंड', ta: 'ஜார்கண்ட்', te: 'ఝార్ఖండ్', kn: 'ಝಾರ್ಖಂಡ್', ml: 'ഝാർഖണ്ഡ്', or: 'ଝାରଖଣ୍ଡ' },
  'Jammu and Kashmir': { hi: 'जम्मू और कश्मीर', ta: 'ஜம்மு மற்றும் காஷ்மீர்', te: 'జమ్మూ మరియు కాశ్మీర్', kn: 'ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ', ml: 'ജമ്മു കശ്മീർ', or: 'ଜମ୍ମୁ ଏବଂ କାଶ୍ମୀର' },
  Karnataka: { hi: 'कर्नाटक', ta: 'கர்நாடகா', te: 'కర్ణాటక', kn: 'ಕರ್ನಾಟಕ', ml: 'കർണാടക', or: 'କର୍ଣ୍ଣାଟକ' },
  Kerala: { hi: 'केरल', ta: 'கேரளா', te: 'కేరళ', kn: 'ಕೇರಳ', ml: 'കേരളം', or: 'କେରଳ' },
  Ladakh: { hi: 'लद्दाख', ta: 'லடாக்', te: 'లడాఖ్', kn: 'ಲಡಾಖ್', ml: 'ലഡാക്ക്', or: 'ଲଦାଖ' },
  Maharashtra: { hi: 'महाराष्ट्र', ta: 'மகாராஷ்டிரா', te: 'మహారాష్ట్ర', kn: 'ಮಹಾರಾಷ್ಟ್ರ', ml: 'മഹാരാഷ്ട്ര', or: 'ମହାରାଷ୍ଟ୍ର' },
  'Madhya Pradesh': { hi: 'मध्य प्रदेश', ta: 'மத்தியப் பிரதேசம்', te: 'మధ్యప్రదేశ్', kn: 'ಮಧ್ಯ ಪ್ರದೇಶ', ml: 'മധ്യപ്രദേശ്', or: 'ମଧ୍ୟ ପ୍ରଦେଶ' },
  Manipur: { hi: 'मणिपुर', ta: 'மணிப்பூர்', te: 'మణిపూర్', kn: 'ಮಣಿಪುರ', ml: 'മണിപ്പൂർ', or: 'ମଣିପୁର' },
  Meghalaya: { hi: 'मेघालय', ta: 'மேகாலயா', te: 'మేఘాలయ', kn: 'ಮೇಘಾಲಯ', ml: 'മേഘാലയ', or: 'ମେଘାଳୟ' },
  Mizoram: { hi: 'मिजोरम', ta: 'மிசோரம்', te: 'మిజోరం', kn: 'ಮಿಜೋರಂ', ml: 'മിസോറം', or: 'ମିଜୋରାମ' },
  Nagaland: { hi: 'नागालैंड', ta: 'நாகாலாந்து', te: 'నాగాలాండ్', kn: 'ನಾಗಾಲ್ಯಾಂಡ್', ml: 'നാഗാലാൻഡ്', or: 'ନାଗାଲ୍ୟାଣ୍ଡ' },
  Odisha: { hi: 'ओडिशा', ta: 'ஒடிஷா', te: 'ఒడిశా', kn: 'ಒಡಿಶಾ', ml: 'ഒഡീഷ', or: 'ଓଡିଶା' },
  Punjab: { hi: 'पंजाब', ta: 'பஞ்சாப்', te: 'పంజాబ్', kn: 'ಪಂಜಾಬ್', ml: 'പഞ്ചാബ്', or: 'ପଞ୍ଜାବ' },
  Rajasthan: { hi: 'राजस्थान', ta: 'ராஜஸ்தான்', te: 'రాజస్థాన్', kn: 'ರಾಜಸ್ಥಾನ', ml: 'രാജസ്ഥാൻ', or: 'ରାଜସ୍ଥାନ' },
  Sikkim: { hi: 'सिक्किम', ta: 'சிக்கிம்', te: 'సిక్కిం', kn: 'ಸಿಕ್ಕಿಂ', ml: 'സിക്കിം', or: 'ସିକ୍କିମ' },
  'Tamil Nadu': { hi: 'तमिलनाडु', ta: 'தமிழ்நாடு', te: 'తమిళనాడు', kn: 'ತಮಿಳುನಾಡು', ml: 'തമിഴ്നാട്', or: 'ତାମିଳନାଡୁ' },
  Telangana: { hi: 'तेलंगाना', ta: 'தெலுங்கானா', te: 'తెలంగాణ', kn: 'ತೆಲಂಗಾಣ', ml: 'തെലങ്കാന', or: 'ତେଲେଙ୍ଗାନା' },
  Tripura: { hi: 'त्रिपुरा', ta: 'திரிபுரா', te: 'త్రిపుర', kn: 'ತ್ರಿಪುರಾ', ml: 'ത്രിപുര', or: 'ତ୍ରିପୁରା' },
  Uttarakhand: { hi: 'उत्तराखंड', ta: 'உத்தரகாண்ட்', te: 'ఉత్తరాఖండ్', kn: 'ಉತ್ತರಾಖಂಡ್', ml: 'ഉത്തരാഖണ്ഡ്', or: 'ଉତ୍ତରାଖଣ୍ଡ' },
  'Uttar Pradesh': { hi: 'उत्तर प्रदेश', ta: 'உத்தரப் பிரதேசம்', te: 'ఉత్తర ప్రదేశ్', kn: 'ಉತ್ತರ ಪ್ರದೇಶ', ml: 'ഉത്തരപ്രദേശ്', or: 'ଉତ୍ତର ପ୍ରଦେଶ' },
  'West Bengal': { hi: 'पश्चिम बंगाल', ta: 'மேற்கு வங்காளம்', te: 'పశ్చిమ బెంగాల్', kn: 'ಪಶ್ಚಿಮ ಬಂಗಾಳ', ml: 'പശ്ചിമ ബംഗാൾ', or: 'ପଶ୍ଚିମ ବଙ୍ଗ' },
  Delhi: { hi: 'दिल्ली', ta: 'டெல்லி', te: 'దిల్లీ', kn: 'ದೆಹಲಿ', ml: 'ഡെൽഹി', or: 'ଦିଲ୍ଲୀ' },
  'NCT of Delhi': { hi: 'दिल्ली', ta: 'டெல்லி', te: 'దిల్లీ', kn: 'ದೆಹಲಿ', ml: 'ഡെൽഹി', or: 'ଦିଲ୍ଲୀ' },
  Chandigarh: { hi: 'चंडीगढ़', ta: 'சண்டிகர்', te: 'చండీగఢ్', kn: 'ಚಂಡೀಗಢ', ml: 'ചണ്ഡീഗഡ്', or: 'ଚଣ୍ଡୀଗଡ଼' },
  Puducherry: { hi: 'पुडुचेरी', ta: 'புதுச்சேரி', te: 'పుదుచ్చేరి', kn: 'ಪುದುಚೇರಿ', ml: 'പുതുച്ചേരി', or: 'ପୁଡୁଚେରି' },
  'Andaman and Nicobar': { hi: 'अंडमान और निकोबार', ta: 'அண்டமான் மற்றும் நிக்கோபார்', te: 'అండమాన్ నికోబార్', kn: 'ಅಂಡಮಾನ ಮತ್ತು ನಿಕೋಬಾರ್', ml: 'അണ്ടമാൻ നിക്കോബാർ', or: 'ଆଣ୍ଡାମାନ ଏବଂ ନିକୋବାର' },
  'Dadra and Nagar Haveli and Daman and Diu': { hi: 'दादरा नगर हवेली और दमन दीव', ta: 'தாத்ரா நகர் ஹவேலி மற்றும் தமன் தீவு', te: 'దాద్రా నగర్ హవేలి మరియు దమన్ దియూ', kn: 'ದಾದ್ರಾ ನಗರ ಹವೇಲಿ ಮತ್ತು ದಮನ್ ದಿಯು', ml: 'ദാദ്രാ നഗർ ഹവേലി ദമൻ ദിയു', or: 'ଦାଦ୍ରା ନଗର ହାବେଲି ଏବଂ ଦମନ ଦିଉ' },
  Lakshadweep: { hi: 'लक्षद्वीप', ta: 'லக்ஷத்வீப்', te: 'లక్షద్వీప్', kn: 'ಲಕ್ಷದ್ವೀಪ', ml: 'ലക്ഷദ്വീപ്', or: 'ଲକ୍ଷଦ୍ୱୀପ' },
};

const mandiCommodityTranslations: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  Apple: { hi: 'सेब', ta: 'ஆப்பிள்', te: 'ఆపిల్', kn: 'ಸೇಬು', ml: 'ആപ്പിൾ', or: 'ସେବ' },
  Banana: { hi: 'केला', ta: 'வாழைப்பழம்', te: 'అరటి', kn: 'ಬಾಳೆಹಣ್ಣು', ml: 'വാഴപ്പഴം', or: 'କଦଳୀ' },
  Barley: { hi: 'जौ', ta: 'பார்லி', te: 'బార్లీ', kn: 'ಜೋಳ (ಬಾರ್ಲಿ)', ml: 'ബാർലി', or: 'ଜଉ' },
  'Castor Seed': { hi: 'अरंडी बीज', ta: 'ஆமணக்கு விதை', te: 'ఆముదం గింజ', kn: 'ಹರಳೆ ಬೀಜ', ml: 'ആമണക്കുരു', or: 'ଏରଣ୍ଡ ମାଣ୍ଡିଆ' },
  Cotton: { hi: 'कपास', ta: 'பருத்தி', te: 'పత్తి', kn: 'ಹತ್ತಿ', ml: 'പരുത്തി', or: 'କପାସ' },
  Gram: { hi: 'चना', ta: 'கொண்டைக்கடலை', te: 'సెనగ', kn: 'ಕಡಲೆ', ml: 'കടല', or: 'ଛଣା' },
  Groundnut: { hi: 'मूंगफली', ta: 'வேர்க்கடலை', te: 'వేరుశెనగ', kn: 'ಕಡಲೆಕಾಯಿ', ml: 'വെരുക്ക', or: 'ବାଦାମ' },
  Kinnow: { hi: 'किन्नू', ta: 'கின்னோ', te: 'కిన్నో', kn: 'ಕಿನ್ನೋ', ml: 'കിന്നോ', or: 'କିନ୍ନୁ' },
  Maize: { hi: 'मक्का', ta: 'மக்காச்சோளம்', te: 'మొక్కజొన్న', kn: 'ಮಕ್ಕೆಜೋಳ', ml: 'മക്കചോളം', or: 'ମକା' },
  Onion: { hi: 'प्याज', ta: 'வெங்காயம்', te: 'ఉల్లిపాయ', kn: 'ಈರುಳ್ಳಿ', ml: 'ഉള്ളി', or: 'ପିଆଜ' },
  Potato: { hi: 'आलू', ta: 'உருளைக்கிழங்கு', te: 'బంగాళాదుంప', kn: 'ಆಲೂಗಡ್ಡೆ', ml: 'ഉരുളക്കിഴങ്ങ്', or: 'ଆଳୁ' },
  Rice: { hi: 'चावल', ta: 'அரிசி', te: 'బియ్యం', kn: 'ಅಕ್ಕಿ', ml: 'അരി', or: 'ଚାଉଳ' },
  Soyabean: { hi: 'सोयाबीन', ta: 'சோயாபீன்', te: 'సోయాబీన్', kn: 'ಸೊಯಾಬೀನ್', ml: 'സോയാബീൻ', or: 'ସୋୟାବିନ' },
  Sugarcane: { hi: 'गन्ना', ta: 'கரும்பு', te: 'చెరకు', kn: 'ಕಬ್ಬು', ml: 'കരിമ്പ്', or: 'ଖଣ୍ଡସାରୁ' },
  Tomato: { hi: 'टमाटर', ta: 'தக்காளி', te: 'టమాటా', kn: 'ಟೊಮಾಟೊ', ml: 'തക്കാളി', or: 'ଟମାଟୋ' },
  Turmeric: { hi: 'हल्दी', ta: 'மஞ்சள்', te: 'పసుపు', kn: 'ಅರಿಶಿನ', ml: 'മഞ്ഞൾ', or: 'ହଳଦି' },
  Wheat: { hi: 'गेहूं', ta: 'கோதுமை', te: 'గోధుమ', kn: 'ಗೋಧಿ', ml: 'ഗോതമ്പ്', or: 'ଗହମ' },
};

const commodityTermTranslations: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  Paddy: { hi: 'धान', ta: 'நெல்', te: 'వరి', kn: 'ನೆಲ್ಲು', ml: 'നെല്ല്', or: 'ଧାନ' },
  Dhan: { hi: 'धान', ta: 'நெல்', te: 'వరి', kn: 'ನೆಲ್ಲು', ml: 'നെല്ല്', or: 'ଧାନ' },
  Chilli: { hi: 'मिर्च', ta: 'மிளகாய்', te: 'మిరపకాయ', kn: 'ಮೆಣಸಿನಕಾಯಿ', ml: 'മുളക്', or: 'ଲଙ୍କା' },
  Green: { hi: 'हरा', ta: 'பச்சை', te: 'పచ్చ', kn: 'ಹಸಿರು', ml: 'പച്ച', or: 'ସବୁଜ' },
  Red: { hi: 'लाल', ta: 'சிவப்பு', te: 'ఎరుపు', kn: 'ಕೆಂಪು', ml: 'ചുവപ്പ്', or: 'ଲାଲ' },
  Mustard: { hi: 'सरसों', ta: 'கடுகு', te: 'ఆవాలు', kn: 'ಸಾಸಿವೆ', ml: 'കടുക്', or: 'ସୋରିଷ' },
  Sesame: { hi: 'तिल', ta: 'எள்', te: 'నువ్వులు', kn: 'ಎಳ್ಳು', ml: 'എള്ള്', or: 'ତିଳ' },
  Bajra: { hi: 'बाजरा', ta: 'கம்பு', te: 'సజ్జ', kn: 'ಸಜ್ಜೆ', ml: 'കമ്പ്', or: 'ବାଜ୍ରା' },
  Jowar: { hi: 'ज्वार', ta: 'சோளம்', te: 'జొన్న', kn: 'ಜೋಳ', ml: 'ചോളം', or: 'ଜୱାର' },
  Ragi: { hi: 'रागी', ta: 'ராகி', te: 'రాగి', kn: 'ರಾಗಿ', ml: 'റാഗി', or: 'ରାଗି' },
  Moong: { hi: 'मूंग', ta: 'பாசிப்பயறு', te: 'పెసలు', kn: 'ಹೆಸರೆಕಾಳು', ml: 'ചെറുപയർ', or: 'ମୁଗ' },
  Urad: { hi: 'उड़द', ta: 'உளுந்து', te: 'మినుములు', kn: 'ಉದ್ದಿನ', ml: 'ഉഴുന്ന്', or: 'ବିରି' },
  Masur: { hi: 'मसूर', ta: 'மசூர்', te: 'మసూర్', kn: 'ಮಸೂರ', ml: 'മസൂർ', or: 'ମସୁର' },
  Arhar: { hi: 'अरहर', ta: 'துவரம்', te: 'కందిపప్పు', kn: 'ತೊಗರಿ', ml: 'തുവര', or: 'ଆରହର' },
  Tur: { hi: 'तूर', ta: 'துவரம்', te: 'తూర్', kn: 'ತೊಗರಿ', ml: 'തുവര', or: 'ତୁର' },
  Lentil: { hi: 'मसूर', ta: 'பருப்பு', te: 'పప్పు', kn: 'ಬೇಳೆ', ml: 'പരിപ്പ്', or: 'ଡାଲି' },
  Coconut: { hi: 'नारियल', ta: 'தேங்காய்', te: 'కొబ్బరి', kn: 'ತೆಂಗಿನಕಾಯಿ', ml: 'തേങ്ങ', or: 'ନଡ଼ିଆ' },
  Brinjal: { hi: 'बैंगन', ta: 'கத்திரிக்காய்', te: 'వంకాయ', kn: 'ಬದನೆಕಾಯಿ', ml: 'വഴുതന', or: 'ବାଇଗଣ' },
  Cabbage: { hi: 'पत्ता गोभी', ta: 'முட்டைகோஸ்', te: 'కాబేజీ', kn: 'ಕೋಸು', ml: 'കാബേജ്', or: 'ବନ୍ଦାକୋବି' },
  Cauliflower: { hi: 'फूलगोभी', ta: 'காலிஃபிளவர்', te: 'కాలీఫ్లవర్', kn: 'ಕಾಲಿಫ್ಲವರ್', ml: 'കോളിഫ്ലവർ', or: 'ଫୁଲକୋବି' },
  Cucumber: { hi: 'खीरा', ta: 'வெள்ளரிக்காய்', te: 'దోసకాయ', kn: 'ಸೌತೆಕಾಯಿ', ml: 'വെള്ളരിക്ക', or: 'କାକୁଡ଼ି' },
  Ginger: { hi: 'अदरक', ta: 'இஞ்சி', te: 'అల్లం', kn: 'ಶುಂಠಿ', ml: 'ഇഞ്ചി', or: 'ଅଦା' },
  Garlic: { hi: 'लहसुन', ta: 'பூண்டு', te: 'వెల్లులి', kn: 'ಬೆಳ್ಳುಳ್ಳಿ', ml: 'വെളുത്തുള്ളി', or: 'ରସୁଣ' },
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCanonicalIndex = (dictionary: Record<string, Partial<Record<SupportedLanguage, string>>>) => {
  const index: Record<string, string> = {};
  Object.keys(dictionary).forEach((key) => {
    index[normalizeKey(key)] = key;
  });
  return index;
};

const stateCanonicalIndex = buildCanonicalIndex(mandiStateTranslations);
const commodityCanonicalIndex = buildCanonicalIndex(mandiCommodityTranslations);

const replaceTerms = (
  value: string,
  language: SupportedLanguage,
  dictionary: Record<string, Partial<Record<SupportedLanguage, string>>>,
) => {
  if (language === 'en') {
    return value;
  }

  let localized = value;
  const terms = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  terms.forEach((term) => {
    const translated = dictionary[term]?.[language];
    if (!translated) {
      return;
    }
    const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
    localized = localized.replace(regex, translated);
  });

  return localized;
};

const toLocalizedValue = (
  value: string,
  language: SupportedLanguage,
  dictionary: Record<string, Partial<Record<SupportedLanguage, string>>>,
  canonicalIndex?: Record<string, string>,
  termsDictionary?: Record<string, Partial<Record<SupportedLanguage, string>>>,
) => {
  if (language === 'en') {
    return value;
  }

  const normalized = normalizeKey(value);
  const canonicalKey = (canonicalIndex && canonicalIndex[normalized]) || value;
  const translated = dictionary[canonicalKey]?.[language] || dictionary[value]?.[language];
  if (translated) {
    return translated;
  }

  if (termsDictionary) {
    return replaceTerms(value, language, termsDictionary);
  }

  return value;
};

const toEnglishFromLocalized = (
  value: string,
  language: SupportedLanguage,
  dictionary: Record<string, Partial<Record<SupportedLanguage, string>>>,
) => {
  if (language === 'en') {
    return value;
  }

  const normalized = normalizeKey(value);
  if (!normalized) {
    return value;
  }

  for (const [english, translations] of Object.entries(dictionary)) {
    const localized = translations[language];
    if (localized?.toLowerCase() === normalized) {
      return english;
    }
  }

  return value;
};

const localizeDigits = (value: string | number, language: SupportedLanguage) => {
  const text = String(value);
  if (language === 'en') {
    return text;
  }

  const digits = languageDigitsMap[language] || languageDigitsMap.en;
  return text.replace(/\d/g, (digit) => digits[Number(digit)]);
};

const formatLocalizedNumber = (value: number, language: SupportedLanguage) => {
  const locale = languageLocaleMap[language] || languageLocaleMap.en;
  return new Intl.NumberFormat(locale).format(value);
};

const formatTrendDate = (date: string, language: SupportedLanguage) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return localizeDigits(date, language);
  }

  const locale = languageLocaleMap[language] || languageLocaleMap.en;
  return parsed.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
};

export default function MandiPrices() {
  const { t, language } = useLanguage();
  const [stateFilter, setStateFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dataSource, setDataSource] = useState<'agmarknet' | 'mock'>('agmarknet');
  const [records, setRecords] = useState<MandiRecord[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchLivePrices = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({ limit: '200' });

        if (stateFilter) {
          params.append('state', stateFilter);
        }

        if (commodityFilter) {
          params.append('commodity', commodityFilter);
        }

        const response = await fetch(`/api/mandi/prices?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(t('mandi.error.loadFailed', 'Failed to load mandi prices'));
        }

        const data: ApiResponse = await response.json();

        setRecords(data.records || []);
        setStates(data.states || []);
        setCommodities(data.commodities || []);
        setTrend(data.trend || []);
        setDataSource((data as ApiResponse & { source?: string }).source === 'mock' ? 'mock' : 'agmarknet');
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return;
        }

        setError(t('mandi.error.unavailable', 'Unable to fetch live mandi prices right now.'));
      } finally {
        setLoading(false);
      }
    };

    fetchLivePrices();

    return () => controller.abort();
  }, [commodityFilter, stateFilter, t]);

  const displayedStates = useMemo(
    () => states.map((stateItem: string) => ({ raw: stateItem, label: toLocalizedValue(stateItem, language, mandiStateTranslations, stateCanonicalIndex) })),
    [language, states],
  );

  const displayedCommodities = useMemo(
    () => commodities.map((commodityItem: string) => ({ raw: commodityItem, label: toLocalizedValue(commodityItem, language, mandiCommodityTranslations, commodityCanonicalIndex, commodityTermTranslations) })),
    [commodities, language],
  );

  const displayedRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return records;
    }

    const englishQueryCommodity = toEnglishFromLocalized(search, language, mandiCommodityTranslations).trim().toLowerCase();
    const englishQueryState = toEnglishFromLocalized(search, language, mandiStateTranslations).trim().toLowerCase();

    return records.filter((record: MandiRecord) => {
      const localizedCommodity = toLocalizedValue(record.commodity, language, mandiCommodityTranslations, commodityCanonicalIndex, commodityTermTranslations).toLowerCase();
      const localizedState = toLocalizedValue(record.state, language, mandiStateTranslations, stateCanonicalIndex).toLowerCase();
      const market = record.market.toLowerCase();
      const commodity = record.commodity.toLowerCase();
      const state = record.state.toLowerCase();

      return (
        localizedCommodity.includes(query)
        || localizedState.includes(query)
        || market.includes(query)
        || commodity.includes(query)
        || state.includes(query)
        || commodity.includes(englishQueryCommodity)
        || state.includes(englishQueryState)
      );
    });
  }, [language, records, search]);

  const chartData = useMemo(() => {
    return {
      labels: trend.map((point: TrendPoint) => formatTrendDate(point.date, language)),
      datasets: [
        {
          label: t('mandi.chart.modalPrice', 'Modal Price (₹/quintal)'),
          data: trend.map((point: TrendPoint) => point.modalPrice),
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          pointBackgroundColor: '#059669',
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [language, trend, t]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: string | number) => {
              const numericValue = typeof value === 'number' ? value : Number(value);
              if (Number.isNaN(numericValue)) {
                return `₹${localizeDigits(value, language)}`;
              }
              return `₹${formatLocalizedNumber(numericValue, language)}`;
            },
          },
        },
      },
    }),
    [language],
  );

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="p-8 space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-3xl font-extrabold tracking-tight">{t('mandi.title', 'Live Mandi Price Tracker')}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dataSource === 'mock' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
              {dataSource === 'mock' ? t('mandi.data.demo', 'Demo data') : t('mandi.data.live', 'Live data')}
            </span>
          </div>
          <p className="text-slate-500 mt-1">{t('mandi.subtitle', 'Daily commodity prices from Agmarknet with quick filtering')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={t('mandi.searchPlaceholder', 'Search crop name')}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={stateFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStateFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('mandi.filter.allStates', 'All States')}</option>
              {displayedStates.map((stateItem) => (
                <option key={stateItem.raw} value={stateItem.raw}>
                  {stateItem.label}
                </option>
              ))}
            </select>

            <select
              value={commodityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCommodityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('mandi.filter.allCommodities', 'All Commodities')}</option>
              {displayedCommodities.map((commodityItem) => (
                <option key={commodityItem.raw} value={commodityItem.raw}>
                  {commodityItem.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between">
            <h4 className="font-bold text-lg">{t('mandi.table.title', 'Daily Commodity Prices')}</h4>
            <span className="text-sm text-slate-500">{localizeDigits(displayedRecords.length, language)} {t('mandi.results', 'results')}</span>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-slate-500">{t('mandi.loading', 'Loading live Agmarknet prices...')}</div>
          ) : error ? (
            <div className="p-8 text-sm text-red-600">{error}</div>
          ) : displayedRecords.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">{t('mandi.empty', 'No records found for selected filters.')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('mandi.table.commodity', 'Commodity')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('mandi.table.state', 'State')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('mandi.table.market', 'Market')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('mandi.table.minPrice', 'Min Price')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('mandi.table.maxPrice', 'Max Price')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('mandi.table.modalPrice', 'Modal Price')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {displayedRecords.map((record, index) => (
                    <tr key={`${record.market}-${record.commodity}-${record.arrivalDate}-${index}`} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-800">{toLocalizedValue(record.commodity, language, mandiCommodityTranslations, commodityCanonicalIndex, commodityTermTranslations)}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{toLocalizedValue(record.state, language, mandiStateTranslations, stateCanonicalIndex)}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{record.market}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 text-right">{localizeDigits(record.minPriceFormatted, language)}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 text-right">{localizeDigits(record.maxPriceFormatted, language)}</td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">{localizeDigits(record.modalPriceFormatted, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-600" />
            <h4 className="font-bold text-lg">{t('mandi.chart.title', '7-Day Modal Price Trend')}</h4>
          </div>

          {trend.length === 0 ? (
            <p className="text-sm text-slate-500">{t('mandi.chart.empty', 'Trend data is not available for the selected filters.')}</p>
          ) : (
            <div className="h-72">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
