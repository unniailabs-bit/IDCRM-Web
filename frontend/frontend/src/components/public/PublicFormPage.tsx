import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from '../ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, XCircle, Maximize2 } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';

const statesAndDistricts = {
  states: [
    {
      state: 'Andaman and Nicobar Islands',
      districts: ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
    },
    {
      state: 'Andhra Pradesh',
      districts: [
        'Anantapur',
        'Chittoor',
        'East Godavari',
        'Guntur',
        'Krishna',
        'Kurnool',
        'Prakasam',
        'SPSR Nellore',
        'Srikakulam',
        'Visakhapatnam',
        'Vizianagaram',
        'West Godavari',
        'YSR Kadapa',
      ],
    },
    {
      state: 'Arunachal Pradesh',
      districts: [
        'Anjaw',
        'Changlang',
        'Dibang Valley',
        'East Kameng',
        'East Siang',
        'Kamle',
        'Kra Daadi',
        'Kurung Kumey',
        'Lepa Rada',
        'Lohit',
        'Longding',
        'Lower Dibang Valley',
        'Lower Siang',
        'Lower Subansiri',
        'Namsai',
        'Pakke Kessang',
        'Papum Pare',
        'Shi Yomi',
        'Siang',
        'Tawang',
        'Tirap',
        'Upper Siang',
        'Upper Subansiri',
        'West Kameng',
        'West Siang',
      ],
    },
    {
      state: 'Assam',
      districts: [
        'Baksa',
        'Barpeta',
        'Biswanath',
        'Bongaigaon',
        'Cachar',
        'Charaideo',
        'Chirang',
        'Darrang',
        'Dhemaji',
        'Dhubri',
        'Dibrugarh',
        'Dima Hasao',
        'Goalpara',
        'Golaghat',
        'Hailakandi',
        'Hojai',
        'Jorhat',
        'Kamrup',
        'Kamrup Metropolitan',
        'Karbi Anglong',
        'Karimganj',
        'Kokrajhar',
        'Lakhimpur',
        'Majuli',
        'Morigaon',
        'Nagaon',
        'Nalbari',
        'Sivasagar',
        'Sonitpur',
        'South Salmara-Mankachar',
        'Tinsukia',
        'Udalguri',
        'West Karbi Anglong',
      ],
    },
    {
      state: 'Bihar',
      districts: [
        'Araria',
        'Arwal',
        'Aurangabad',
        'Banka',
        'Begusarai',
        'Bhagalpur',
        'Bhojpur',
        'Buxar',
        'Darbhanga',
        'East Champaran',
        'Gaya',
        'Gopalganj',
        'Jamui',
        'Jehanabad',
        'Kaimur',
        'Katihar',
        'Khagaria',
        'Kishanganj',
        'Lakhisarai',
        'Madhepura',
        'Madhubani',
        'Munger',
        'Muzaffarpur',
        'Nalanda',
        'Nawada',
        'Patna',
        'Purnia',
        'Rohtas',
        'Saharsa',
        'Samastipur',
        'Saran',
        'Sheikhpura',
        'Sheohar',
        'Sitamarhi',
        'Siwan',
        'Supaul',
        'Vaishali',
        'West Champaran',
      ],
    },
    {
      state: 'Chandigarh',
      districts: ['Chandigarh'],
    },
    {
      state: 'Chhattisgarh',
      districts: [
        'Balod',
        'Baloda Bazar',
        'Balrampur',
        'Bastar',
        'Bemetara',
        'Bijapur',
        'Bilaspur',
        'Dantewada',
        'Dhamtari',
        'Durg',
        'Gariaband',
        'Gaurela-Pendra-Marwahi',
        'Janjgir-Champa',
        'Jashpur',
        'Kabirdham',
        'Kanker',
        'Kondagaon',
        'Korba',
        'Koriya',
        'Mahasamund',
        'Mungeli',
        'Narayanpur',
        'Raigarh',
        'Raipur',
        'Rajnandgaon',
        'Sukma',
        'Surajpur',
        'Surguja',
      ],
    },
    {
      state: 'Dadra and Nagar Haveli and Daman and Diu',
      districts: ['Daman', 'Diu', 'Dadra and Nagar Haveli'],
    },
    {
      state: 'Delhi',
      districts: [
        'Central Delhi',
        'East Delhi',
        'New Delhi',
        'North Delhi',
        'North East Delhi',
        'North West Delhi',
        'Shahdara',
        'South Delhi',
        'South East Delhi',
        'South West Delhi',
        'West Delhi',
      ],
    },
    {
      state: 'Goa',
      districts: ['North Goa', 'South Goa'],
    },
    {
      state: 'Gujarat',
      districts: [
        'Ahmedabad',
        'Amreli',
        'Anand',
        'Aravalli',
        'Banaskantha',
        'Bharuch',
        'Bhavnagar',
        'Botad',
        'Chhota Udaipur',
        'Dahod',
        'Dang',
        'Devbhoomi Dwarka',
        'Gandhinagar',
        'Gir Somnath',
        'Jamnagar',
        'Junagadh',
        'Kheda',
        'Kutch',
        'Mahisagar',
        'Mehsana',
        'Morbi',
        'Narmada',
        'Navsari',
        'Panchmahal',
        'Patan',
        'Porbandar',
        'Rajkot',
        'Sabarkantha',
        'Surat',
        'Surendranagar',
        'Tapi',
        'Vadodara',
        'Valsad',
      ],
    },
    {
      state: 'Haryana',
      districts: [
        'Ambala',
        'Bhiwani',
        'Charkhi Dadri',
        'Faridabad',
        'Fatehabad',
        'Gurugram',
        'Hisar',
        'Jhajjar',
        'Jind',
        'Kaithal',
        'Karnal',
        'Kurukshetra',
        'Mahendragarh',
        'Nuh',
        'Palwal',
        'Panchkula',
        'Panipat',
        'Rewari',
        'Rohtak',
        'Sirsa',
        'Sonipat',
        'Yamunanagar',
      ],
    },
    {
      state: 'Himachal Pradesh',
      districts: [
        'Bilaspur',
        'Chamba',
        'Hamirpur',
        'Kangra',
        'Kinnaur',
        'Kullu',
        'Lahaul and Spiti',
        'Mandi',
        'Shimla',
        'Sirmaur',
        'Solan',
        'Una',
      ],
    },
    {
      state: 'Jammu and Kashmir',
      districts: [
        'Anantnag',
        'Bandipora',
        'Baramulla',
        'Budgam',
        'Doda',
        'Ganderbal',
        'Jammu',
        'Kathua',
        'Kishtwar',
        'Kulgam',
        'Kupwara',
        'Poonch',
        'Pulwama',
        'Rajouri',
        'Ramban',
        'Reasi',
        'Samba',
        'Shopian',
        'Srinagar',
        'Udhampur',
      ],
    },
    {
      state: 'Jharkhand',
      districts: [
        'Bokaro',
        'Chatra',
        'Deoghar',
        'Dhanbad',
        'Dumka',
        'East Singhbhum',
        'Garhwa',
        'Giridih',
        'Godda',
        'Gumla',
        'Hazaribagh',
        'Jamtara',
        'Khunti',
        'Koderma',
        'Latehar',
        'Lohardaga',
        'Pakur',
        'Palamu',
        'Ramgarh',
        'Ranchi',
        'Sahebganj',
        'Seraikela-Kharsawan',
        'Simdega',
        'West Singhbhum',
      ],
    },
    {
      state: 'Karnataka',
      districts: [
        'Bagalkot',
        'Ballari',
        'Belagavi',
        'Bengaluru Rural',
        'Bengaluru Urban',
        'Bidar',
        'Chamarajanagar',
        'Chikballapur',
        'Chikkamagaluru',
        'Chitradurga',
        'Dakshina Kannada',
        'Davanagere',
        'Dharwad',
        'Gadag',
        'Hassan',
        'Haveri',
        'Kalaburagi',
        'Kodagu',
        'Kolar',
        'Koppal',
        'Mandya',
        'Mysuru',
        'Raichur',
        'Ramanagara',
        'Shivamogga',
        'Tumakuru',
        'Udupi',
        'Uttara Kannada',
        'Vijayapura',
        'Yadgir',
      ],
    },
    {
      state: 'Kerala',
      districts: [
        'Alappuzha',
        'Ernakulam',
        'Idukki',
        'Kannur',
        'Kasaragod',
        'Kollam',
        'Kottayam',
        'Kozhikode',
        'Malappuram',
        'Palakkad',
        'Pathanamthitta',
        'Thiruvananthapuram',
        'Thrissur',
        'Wayanad',
      ],
    },
    {
      state: 'Ladakh',
      districts: ['Kargil', 'Leh'],
    },
    {
      state: 'Lakshadweep',
      districts: ['Lakshadweep'],
    },
    {
      state: 'Madhya Pradesh',
      districts: [
        'Agar Malwa',
        'Alirajpur',
        'Anuppur',
        'Ashoknagar',
        'Balaghat',
        'Barwani',
        'Betul',
        'Bhind',
        'Bhopal',
        'Burhanpur',
        'Chhatarpur',
        'Chhindwara',
        'Damoh',
        'Datia',
        'Dewas',
        'Dhar',
        'Dindori',
        'Guna',
        'Gwalior',
        'Harda',
        'Hoshangabad',
        'Indore',
        'Jabalpur',
        'Jhabua',
        'Katni',
        'Khandwa',
        'Khargone',
        'Mandla',
        'Mandsaur',
        'Morena',
        'Narsinghpur',
        'Neemuch',
        'Panna',
        'Raisen',
        'Rajgarh',
        'Ratlam',
        'Rewa',
        'Sagar',
        'Satna',
        'Sehore',
        'Seoni',
        'Shahdol',
        'Shajapur',
        'Sheopur',
        'Shivpuri',
        'Sidhi',
        'Singrauli',
        'Tikamgarh',
        'Ujjain',
        'Umaria',
        'Vidisha',
      ],
    },
    {
      state: 'Maharashtra',
      districts: [
        'Ahmednagar',
        'Akola',
        'Amravati',
        'Aurangabad',
        'Beed',
        'Bhandara',
        'Buldhana',
        'Chandrapur',
        'Dhule',
        'Gadchiroli',
        'Gondia',
        'Hingoli',
        'Jalgaon',
        'Jalna',
        'Kolhapur',
        'Latur',
        'Mumbai City',
        'Mumbai Suburban',
        'Nagpur',
        'Nanded',
        'Nandurbar',
        'Nashik',
        'Osmanabad',
        'Palghar',
        'Parbhani',
        'Pune',
        'Raigad',
        'Ratnagiri',
        'Sangli',
        'Satara',
        'Sindhudurg',
        'Solapur',
        'Thane',
        'Wardha',
        'Washim',
        'Yavatmal',
      ],
    },
    {
      state: 'Manipur',
      districts: [
        'Bishnupur',
        'Churachandpur',
        'Imphal East',
        'Imphal West',
        'Jiribam',
        'Kakching',
        'Kamjong',
        'Kangpokpi',
        'Noney',
        'Pherzawl',
        'Senapati',
        'Tamenglong',
        'Tengnoupal',
        'Thoubal',
        'Ukhrul',
      ],
    },
    {
      state: 'Meghalaya',
      districts: [
        'East Garo Hills',
        'East Jaintia Hills',
        'East Khasi Hills',
        'North Garo Hills',
        'Ri Bhoi',
        'South Garo Hills',
        'South West Garo Hills',
        'South West Khasi Hills',
        'West Garo Hills',
        'West Jaintia Hills',
        'West Khasi Hills',
      ],
    },
    {
      state: 'Mizoram',
      districts: [
        'Aizawl',
        'Champhai',
        'Hnahthial',
        'Khawzawl',
        'Kolasib',
        'Lawngtlai',
        'Lunglei',
        'Mamit',
        'Saiha',
        'Saitual',
        'Serchhip',
      ],
    },
    {
      state: 'Nagaland',
      districts: [
        'Dimapur',
        'Kiphire',
        'Kohima',
        'Longleng',
        'Mokokchung',
        'Mon',
        'Noklak',
        'Peren',
        'Phek',
        'Tuensang',
        'Wokha',
        'Zunheboto',
      ],
    },
    {
      state: 'Odisha',
      districts: [
        'Angul',
        'Balangir',
        'Balasore',
        'Bargarh',
        'Bhadrak',
        'Boudh',
        'Cuttack',
        'Deogarh',
        'Dhenkanal',
        'Gajapati',
        'Ganjam',
        'Jagatsinghpur',
        'Jajpur',
        'Jharsuguda',
        'Kalahandi',
        'Kandhamal',
        'Kendrapara',
        'Kendujhar',
        'Khordha',
        'Koraput',
        'Malkangiri',
        'Mayurbhanj',
        'Nabarangpur',
        'Nayagarh',
        'Nuapada',
        'Puri',
        'Rayagada',
        'Sambalpur',
        'Sonepur',
        'Sundargarh',
      ],
    },
    {
      state: 'Puducherry',
      districts: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
    },
    {
      state: 'Punjab',
      districts: [
        'Amritsar',
        'Barnala',
        'Bathinda',
        'Faridkot',
        'Fatehgarh Sahib',
        'Fazilka',
        'Ferozepur',
        'Gurdaspur',
        'Hoshiarpur',
        'Jalandhar',
        'Kapurthala',
        'Ludhiana',
        'Mansa',
        'Moga',
        'Pathankot',
        'Patiala',
        'Rupnagar',
        'SAS Nagar',
        'Sangrur',
        'Shahid Bhagat Singh Nagar',
        'Sri Muktsar Sahib',
        'Tarn Taran',
      ],
    },
    {
      state: 'Rajasthan',
      districts: [
        'Ajmer',
        'Alwar',
        'Banswara',
        'Baran',
        'Barmer',
        'Bharatpur',
        'Bhilwara',
        'Bikaner',
        'Bundi',
        'Chittorgarh',
        'Churu',
        'Dausa',
        'Dholpur',
        'Dungarpur',
        'Hanumangarh',
        'Jaipur',
        'Jaisalmer',
        'Jalore',
        'Jhalawar',
        'Jhunjhunu',
        'Jodhpur',
        'Karauli',
        'Kota',
        'Nagaur',
        'Pali',
        'Pratapgarh',
        'Rajsamand',
        'Sawai Madhopur',
        'Sikar',
        'Sirohi',
        'Sri Ganganagar',
        'Tonk',
        'Udaipur',
      ],
    },
    {
      state: 'Sikkim',
      districts: ['East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'],
    },
    {
      state: 'Tamil Nadu',
      districts: [
        'Ariyalur',
        'Chengalpattu',
        'Chennai',
        'Coimbatore',
        'Cuddalore',
        'Dharmapuri',
        'Dindigul',
        'Erode',
        'Kallakurichi',
        'Kanchipuram',
        'Kanyakumari',
        'Karur',
        'Krishnagiri',
        'Madurai',
        'Mayiladuthurai',
        'Nagapattinam',
        'Namakkal',
        'Nilgiris',
        'Perambalur',
        'Pudukkottai',
        'Ramanathapuram',
        'Ranipet',
        'Salem',
        'Sivaganga',
        'Tenkasi',
        'Thanjavur',
        'Theni',
        'Thoothukudi',
        'Tiruchirappalli',
        'Tirunelveli',
        'Tirupathur',
        'Tiruppur',
        'Tiruvallur',
        'Tiruvannamalai',
        'Tiruvarur',
        'Vellore',
        'Viluppuram',
        'Virudhunagar',
      ],
    },
    {
      state: 'Telangana',
      districts: [
        'Adilabad',
        'Bhadradri Kothagudem',
        'Hyderabad',
        'Jagitial',
        'Jangaon',
        'Jayashankar Bhupalpally',
        'Jogulamba Gadwal',
        'Kamareddy',
        'Karimnagar',
        'Khammam',
        'Komaram Bheem',
        'Mahabubabad',
        'Mahabubnagar',
        'Mancherial',
        'Medak',
        'Medchal-Malkajgiri',
        'Mulugu',
        'Nagarkurnool',
        'Nalgonda',
        'Narayanpet',
        'Nirmal',
        'Nizamabad',
        'Peddapalli',
        'Rajanna Sircilla',
        'Ranga Reddy',
        'Sangareddy',
        'Siddipet',
        'Suryapet',
        'Vikarabad',
        'Wanaparthy',
        'Warangal Rural',
        'Warangal Urban',
        'Yadadri Bhuvanagiri',
      ],
    },
    {
      state: 'Tripura',
      districts: [
        'Dhalai',
        'Gomati',
        'Khowai',
        'North Tripura',
        'Sepahijala',
        'South Tripura',
        'Unakoti',
        'West Tripura',
      ],
    },
    {
      state: 'Uttar Pradesh',
      districts: [
        'Agra',
        'Aligarh',
        'Ambedkar Nagar',
        'Amethi',
        'Amroha',
        'Auraiya',
        'Ayodhya',
        'Azamgarh',
        'Baghpat',
        'Bahraich',
        'Ballia',
        'Balrampur',
        'Banda',
        'Barabanki',
        'Bareilly',
        'Basti',
        'Bhadohi',
        'Bijnor',
        'Budaun',
        'Bulandshahr',
        'Chandauli',
        'Chitrakoot',
        'Deoria',
        'Etah',
        'Etawah',
        'Farrukhabad',
        'Fatehpur',
        'Firozabad',
        'Gautam Buddha Nagar',
        'Ghaziabad',
        'Ghazipur',
        'Gonda',
        'Gorakhpur',
        'Hamirpur',
        'Hapur',
        'Hardoi',
        'Hathras',
        'Jalaun',
        'Jaunpur',
        'Jhansi',
        'Kannauj',
        'Kanpur Dehat',
        'Kanpur Nagar',
        'Kasganj',
        'Kaushambi',
        'Kheri',
        'Kushinagar',
        'Lalitpur',
        'Lucknow',
        'Maharajganj',
        'Mahoba',
        'Mainpuri',
        'Mathura',
        'Mau',
        'Meerut',
        'Mirzapur',
        'Moradabad',
        'Muzaffarnagar',
        'Pilibhit',
        'Pratapgarh',
        'Prayagraj',
        'Raebareli',
        'Rampur',
        'Saharanpur',
        'Sambhal',
        'Sant Kabir Nagar',
        'Shahjahanpur',
        'Shamli',
        'Shravasti',
        'Siddharthnagar',
        'Sitapur',
        'Sonbhadra',
        'Sultanpur',
        'Unnao',
        'Varanasi',
      ],
    },
    {
      state: 'Uttarakhand',
      districts: [
        'Almora',
        'Bageshwar',
        'Chamoli',
        'Champawat',
        'Dehradun',
        'Haridwar',
        'Nainital',
        'Pauri Garhwal',
        'Pithoragarh',
        'Rudraprayag',
        'Tehri Garhwal',
        'Udham Singh Nagar',
        'Uttarkashi',
      ],
    },
    {
      state: 'West Bengal',
      districts: [
        'Alipurduar',
        'Bankura',
        'Birbhum',
        'Cooch Behar',
        'Dakshin Dinajpur',
        'Darjeeling',
        'Hooghly',
        'Howrah',
        'Jalpaiguri',
        'Jhargram',
        'Kalimpong',
        'Kolkata',
        'Malda',
        'Murshidabad',
        'Nadia',
        'North 24 Parganas',
        'Paschim Bardhaman',
        'Paschim Medinipur',
        'Purba Bardhaman',
        'Purba Medinipur',
        'Purulia',
        'South 24 Parganas',
        'Uttar Dinajpur',
      ],
    },
  ],
};

interface FormData {
  roll_number: string;
  id_no: string;
  gr_no: string;
  sr_no: string;
  admission_no: string;
  register_no: string;
  bus_no: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  photo: string | File;
  father_name: string;
  father_phone: string;
  father_email: string;
  father_occupation: string;
  father_office_address: string;
  father_photo: string | File;
  mother_name: string;
  mother_phone: string;
  mother_email: string;
  mother_occupation: string;
  mother_office_address: string;
  mother_photo: string | File;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_occupation: string;
  guardian_office_address: string;
  guardian_photo: string | File;
  guardian_relation: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  emergency_contact: string;
}

interface FieldCorrectionStatus {
  [key: string]: boolean; // true = needs correction, false = correct
}

interface FieldCorrectionNotes {
  [key: string]: string; // field name -> correction note
}

export function PublicFormPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId');
  const revision = searchParams.get('revision');
  const individualToken = searchParams.get('token');

  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; title: string } | null>(null);

  // Remove all camera-related states
  const [step, setStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [cities, setCities] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const occupationOptions = [
    { value: 'Business', label: t('publicForm.occupations.business') },
    { value: 'Service', label: t('publicForm.occupations.service') },
    { value: 'Self Employed', label: t('publicForm.occupations.selfEmployed') },
    { value: 'Retired', label: t('publicForm.occupations.retired') },
    { value: 'Housewife', label: t('publicForm.occupations.housewife') },
  ];

  // // Camera related state
  // const [showCamera, setShowCamera] = useState(false);
  // const [faceAligned, setFaceAligned] = useState(false);
  // const [faceAlignedMessage, setFaceAlignedMessage] = useState<string>(
  //   'Align face within the frame'
  // );
  // const [faceAlignedColor, setFaceAlignedColor] = useState<string>('text-yellow-600');
  // const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  // const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  // const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  // const webcamRef = useRef<Webcam>(null);

  // const getCameraDevices = useCallback(async () => {
  //   try {
  //     const devices = await navigator.mediaDevices.enumerateDevices();
  //     const videoDevices = devices.filter((device) => device.kind === 'videoinput');
  //     setAvailableDevices(videoDevices);

  //     // Set default device (front camera if available)
  //     if (videoDevices.length > 0) {
  //       // Try to find front camera (usually labeled with 'front' or facing 'user')
  //       const frontCamera = videoDevices.find(
  //         (device) =>
  //           device.label.toLowerCase().includes('front') ||
  //           device.label.toLowerCase().includes('facetime')
  //       );

  //       if (frontCamera) {
  //         setSelectedDeviceId(frontCamera.deviceId);
  //         setFacingMode('user');
  //       } else {
  //         setSelectedDeviceId(videoDevices[0].deviceId);
  //         setFacingMode('environment'); // Default to back camera if no front camera found
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error getting camera devices:', error);
  //     toast.error('Could not access camera devices');
  //   }
  // }, []);

  // // Switch camera function
  // const switchCamera = () => {
  //   if (availableDevices.length <= 1) {
  //     toast.info('Only one camera available');
  //     return;
  //   }

  //   const currentIndex = availableDevices.findIndex(
  //     (device) => device.deviceId === selectedDeviceId
  //   );
  //   const nextIndex = (currentIndex + 1) % availableDevices.length;
  //   const nextDevice = availableDevices[nextIndex];

  //   setSelectedDeviceId(nextDevice.deviceId);

  //   // Update facing mode based on device label or alternate between modes
  //   const deviceLabel = nextDevice.label.toLowerCase();
  //   if (deviceLabel.includes('front') || deviceLabel.includes('facetime')) {
  //     setFacingMode('user');
  //   } else if (deviceLabel.includes('back') || deviceLabel.includes('rear')) {
  //     setFacingMode('environment');
  //   } else {
  //     // Toggle between user and environment if we can't determine
  //     setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  //   }

  //   toast.success(`Switched to ${nextDevice.label || 'camera'}`);
  // };

  // // Get current camera label
  // const getCurrentCameraLabel = () => {
  //   const device = availableDevices.find((d) => d.deviceId === selectedDeviceId);
  //   if (!device) return facingMode === 'user' ? 'Front Camera' : 'Back Camera';

  //   const label = device.label || '';
  //   if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
  //     return 'Back Camera';
  //   } else if (label.toLowerCase().includes('front') || label.toLowerCase().includes('facetime')) {
  //     return 'Front Camera';
  //   }
  //   return label || 'Camera';
  // };

  // // Updated video constraints for selected device
  // const videoConstraints = {
  //   deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
  //   facingMode: facingMode,
  //   width: { ideal: 300 },
  //   height: { ideal: 300 },
  // };

  // // Initialize cameras when camera dialog opens
  // useEffect(() => {
  //   if (showCamera) {
  //     getCameraDevices();

  //     // Start face alignment check
  //     setTimeout(() => {
  //       setFaceAligned(true);
  //       setFaceAlignedMessage('Face aligned! Ready to capture');
  //       setFaceAlignedColor('text-green-600');
  //     }, 3000);
  //   } else {
  //     // Reset camera state when dialog closes
  //     setFaceAligned(false);
  //     setFaceAlignedMessage('Align face within the frame');
  //     setFaceAlignedColor('text-yellow-600');
  //   }
  // }, [showCamera, getCameraDevices]);

  // // Helper function to convert base64 to File
  // const dataURLtoFile = (dataurl: string, filename: string): File => {
  //   const arr = dataurl.split(',');
  //   const mime = arr[0].match(/:(.*?);/)![1];
  //   const bstr = atob(arr[1]);
  //   let n = bstr.length;
  //   const u8arr = new Uint8Array(n);
  //   while (n--) {
  //     u8arr[n] = bstr.charCodeAt(n);
  //   }
  //   return new File([u8arr], filename, { type: mime });
  // };

  // // Camera capture function
  // const capturePhoto = () => {
  //   if (webcamRef.current) {
  //     const imageSrc = (webcamRef.current as any).getScreenshot();
  //     // Validate image dimensions
  //     const img = new Image();
  //     img.src = imageSrc;
  //     img.onload = () => {
  //       const width = img.width;
  //       const height = img.height;
  //       const aspectRatio = width / height;

  //       // Check for minimum size (300x300 pixels) and aspect ratio (close to 1:1)
  //       if (width >= 300 && height >= 300 && aspectRatio > 0.8 && aspectRatio < 1.2) {
  //         // Create a File object from the base64 image
  //         const file = dataURLtoFile(imageSrc, 'student-photo.jpg');
  //         handleChange('photo', file);
  //         setShowCamera(false);
  //         toast.success('Photo captured successfully!');
  //       } else {
  //         toast.error(
  //           'Photo must be at least 300x300 pixels with proper aspect ratio (close to square)'
  //         );
  //       }
  //     };
  //   }
  // };

  // // Function to validate uploaded file
  // const validateAndUploadFile = (file: File) => {
  //   // Check file size (max 2MB)
  //   if (file.size > 2 * 1024 * 1024) {
  //     toast.error('File size must be less than 2MB');
  //     return;
  //   }

  //   // Check file type
  //   const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  //   if (!validTypes.includes(file.type)) {
  //     toast.error('Only JPG and PNG files are allowed');
  //     return;
  //   }

  //   // Check image dimensions
  //   const img = new Image();
  //   img.src = URL.createObjectURL(file);
  //   img.onload = () => {
  //     const width = img.width;
  //     const height = img.height;
  //     const aspectRatio = width / height;

  //     if (width >= 300 && height >= 300 && aspectRatio > 0.8 && aspectRatio < 1.2) {
  //       handleChange('photo', file);
  //       toast.success('Photo uploaded successfully!');
  //     } else {
  //       toast.error(
  //         'Photo must be at least 300x300 pixels with proper aspect ratio (close to square)'
  //       );
  //     }
  //   };
  // };

  // // Update the checkFaceAlignment function to reset camera check
  // const checkFaceAlignment = () => {
  //   // For now, we'll simulate face alignment after 3 seconds
  //   setTimeout(() => {
  //     setFaceAligned(true);
  //     setFaceAlignedMessage('Face aligned! Ready to capture');
  //     setFaceAlignedColor('text-green-600');
  //   }, 3000);
  // };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formInfo, setFormInfo] = useState<{
    class_name: string;
    division: string;
    school_id: number;
    existing_form?: any;
    fields_requiring_correction?: FieldCorrectionStatus;
    correction_field_notes?: FieldCorrectionNotes;
    correction_notes?: string;
    requires_correction?: boolean;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    roll_number: '',
    id_no: '',
    gr_no: '',
    sr_no: '',
    admission_no: '',
    register_no: '',
    bus_no: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    gender: '',
    blood_group: '',
    photo: '',
    father_name: '',
    father_phone: '',
    father_email: '',
    father_occupation: '',
    father_office_address: '',
    father_photo: '',
    mother_name: '',
    mother_phone: '',
    mother_email: '',
    mother_occupation: '',
    mother_office_address: '',
    mother_photo: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_occupation: '',
    guardian_office_address: '',
    guardian_photo: '',
    guardian_relation: '',
    street_address: '',
    city: '',
    state: '',
    pin_code: '',
    emergency_contact: '',
  });

  useEffect(() => {
    fetchFormInfo();
  }, [token, formId, revision, individualToken]);

  useEffect(() => {
    if (formData.state) {
      const stateData = statesAndDistricts.states.find((s) => s.state === formData.state);
      if (stateData) {
        setCities(stateData.districts);
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [formData.state]);

  // For state suggestions
  useEffect(() => {
    if (formData.state) {
      const filtered = statesAndDistricts.states
        .map((s) => s.state)
        .filter((state) => state.toLowerCase().includes(formData.state.toLowerCase()))
        .slice(0, 5); // Show top 5 matches
      setStateSuggestions(filtered);
    } else {
      setStateSuggestions([]);
    }
  }, [formData.state]);

  // For city suggestions
  useEffect(() => {
    if (formData.city) {
      const stateData = statesAndDistricts.states.find((s) => s.state === formData.state);
      let filtered: string[] = [];

      if (stateData) {
        // If state is selected, search only in that state's cities
        filtered = stateData.districts
          .filter((city) => city.toLowerCase().includes(formData.city.toLowerCase()))
          .slice(0, 5);
      } else {
        // If no state selected, search in all cities
        const allCities = statesAndDistricts.states.flatMap((s) => s.districts);
        filtered = allCities
          .filter((city) => city.toLowerCase().includes(formData.city.toLowerCase()))
          .slice(0, 5);
      }

      setCitySuggestions(filtered);
    } else {
      setCitySuggestions([]);
    }
  }, [formData.city, formData.state]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const stateInput = document.querySelector('[data-field="state"]');
      const cityInput = document.querySelector('[data-field="city"]');

      if (stateInput && !stateInput.contains(event.target as Node)) {
        setShowStateSuggestions(false);
      }
      if (cityInput && !cityInput.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (field: keyof FormData, value: string | File) => {
    // Clear validation error when field changes
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'state') {
      setFormData((prev) => ({ ...prev, state: value as string, city: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const fetchFormInfo = async () => {
    try {
      const url = formId
        ? `/api/form-links/public/${token}?formId=${formId}&revision=${revision || ''}&token=${individualToken || ''
        }`
        : `/api/form-links/public/${token}`;

      const response = await axiosInstance.get(url);
      if (response.data.success) {
        const data = response.data.data;
        setFormInfo(data);

        // Pre-fill form if existing data exists
        if (data.existing_form) {
          const existing = data.existing_form;
          setFormData({
            roll_number: existing.roll_number || '',
            id_no: existing.id_no || '',
            gr_no: existing.gr_no || '',
            sr_no: existing.sr_no || '',
            admission_no: existing.admission_no || '',
            register_no: existing.register_no || '',
            bus_no: existing.bus_no || '',
            first_name: existing.first_name || '',
            middle_name: existing.middle_name || '',
            last_name: existing.last_name || '',
            dob: existing.dob || '',
            gender: existing.gender || '',
            blood_group: existing.blood_group || '',
            photo: existing.photo || '',
            father_name: existing.father_name || '',
            father_phone: existing.father_phone || '',
            father_email: existing.father_email || '',
            father_occupation: existing.father_occupation || '',
            father_office_address: existing.father_office_address || '',
            father_photo: existing.father_photo || '',
            mother_name: existing.mother_name || '',
            mother_phone: existing.mother_phone || '',
            mother_email: existing.mother_email || '',
            mother_occupation: existing.mother_occupation || '',
            mother_office_address: existing.mother_office_address || '',
            mother_photo: existing.mother_photo || '',
            guardian_name: existing.guardian_name || '',
            guardian_phone: existing.guardian_phone || '',
            guardian_email: existing.guardian_email || '',
            guardian_occupation: existing.guardian_occupation || '',
            guardian_office_address: existing.guardian_office_address || '',
            guardian_photo: existing.guardian_photo || '',
            guardian_relation: existing.guardian_relation || '',
            street_address: existing.street_address || '',
            city: existing.city || '',
            state: existing.state || '',
            pin_code: existing.pin_code || '',
            emergency_contact: existing.emergency_contact || '',
          });

          // Show correction notice if applicable
          if (data.requires_correction && data.correction_notes) {
            toast.warning(t('publicForm.validation.reviewCorrections'));
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching form info:', error);
      toast.error(error.response?.data?.message || t('publicForm.validation.invalidLink'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    return nameRegex.test(name);
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (currentStep === 1) {
      const requiredFields: (keyof FormData)[] = [
        'first_name',
        'middle_name',
        'last_name',
        'dob',
        'gender',
        'blood_group',
        'street_address',
        'city',
        'state',
        'pin_code',
        'emergency_contact',
        'photo',
      ];

      requiredFields.forEach((field) => {
        const value = formData[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field] = t('publicForm.validation.fieldRequired');
        }
      });

      // Validate names
      if (formData.first_name && !validateName(formData.first_name)) {
        newErrors.first_name = t('publicForm.validation.invalidName');
      }
      if (formData.middle_name && !validateName(formData.middle_name)) {
        newErrors.middle_name = t('publicForm.validation.invalidName');
      }
      if (formData.last_name && !validateName(formData.last_name)) {
        newErrors.last_name = t('publicForm.validation.invalidName');
      }

      // Validate DOB (must not be in the future)
      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        if (dobDate > today) {
          newErrors.dob = t('publicForm.validation.futureDob');
        }
      }

      // Validate emergency contact phone
      if (formData.emergency_contact && !validatePhone(formData.emergency_contact)) {
        newErrors.emergency_contact = t('publicForm.validation.invalidPhone');
      }

      // Validate pin code (should be 6 digits)
      if (formData.pin_code && !/^[0-9]{6}$/.test(formData.pin_code)) {
        newErrors.pin_code = t('publicForm.validation.invalidPin');
      }
    } else if (currentStep === 2) {
      const requiredFields: (keyof FormData)[] = [
        'father_name',
        'father_phone',
        'father_email',
        'father_photo',
        'mother_name',
        'mother_phone',
        'mother_email',
        'mother_photo',
      ];

      requiredFields.forEach((field) => {
        const value = formData[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field] = t('publicForm.validation.fieldRequired');
        }
      });

      // Validate names
      if (formData.father_name && !validateName(formData.father_name)) {
        newErrors.father_name = t('publicForm.validation.invalidName');
      }
      if (formData.mother_name && !validateName(formData.mother_name)) {
        newErrors.mother_name = t('publicForm.validation.invalidName');
      }

      // Validate emails
      if (formData.father_email && !validateEmail(formData.father_email)) {
        newErrors.father_email = t('publicForm.validation.invalidEmail');
      }
      if (formData.mother_email && !validateEmail(formData.mother_email)) {
        newErrors.mother_email = t('publicForm.validation.invalidEmail');
      }

      // Validate phone numbers
      if (formData.father_phone && !validatePhone(formData.father_phone)) {
        newErrors.father_phone = t('publicForm.validation.invalidPhone');
      }
      if (formData.mother_phone && !validatePhone(formData.mother_phone)) {
        newErrors.mother_phone = t('publicForm.validation.invalidPhone');
      }

      // Guardian Validation (Optional but validated if provided)
      if (formData.guardian_name) {
        if (!validateName(formData.guardian_name)) {
          newErrors.guardian_name = t('publicForm.validation.invalidName');
        }
      }

      if (formData.guardian_phone && !validatePhone(formData.guardian_phone)) {
        newErrors.guardian_phone = t('publicForm.validation.invalidPhone');
      }

      if (formData.guardian_email && !validateEmail(formData.guardian_email)) {
        newErrors.guardian_email = t('publicForm.validation.invalidEmail');
      }
    }

    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(t('publicForm.validation.correctErrors'));
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1));
    }
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const goTo = (i: number) => {
    // Only allow going back or going to steps that pass validation
    if (i <= step) {
      setStep(i);
    } else {
      // If trying to go forward, validate all steps in between
      for (let s = step; s < i; s++) {
        if (!validateStep(s)) return;
      }
      setStep(i);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create FormData
      const submitData = new FormData();

      // Helper to append field if it exists
      const appendIfDefined = (key: string, value: any) => {
        if (value !== undefined && value !== null && value !== '') {
          submitData.append(key, value.toString());
        }
      };

      // 1. Handle Main Photo (Student) - Send as File if it's a File
      if (formData.photo instanceof File) {
        submitData.append('photo', formData.photo);
      } else if (typeof formData.photo === 'string' && formData.photo) {
        submitData.append('photo', formData.photo);
      }

      // 2. Handle Secondary Photos - Send as File if it's a File
      if (formData.father_photo instanceof File) {
        submitData.append('father_photo', formData.father_photo);
      } else if (formData.father_photo) {
        submitData.append('father_photo', formData.father_photo as string);
      }

      if (formData.mother_photo instanceof File) {
        submitData.append('mother_photo', formData.mother_photo);
      } else if (formData.mother_photo) {
        submitData.append('mother_photo', formData.mother_photo as string);
      }

      if (formData.guardian_photo instanceof File) {
        submitData.append('guardian_photo', formData.guardian_photo);
      } else if (formData.guardian_photo) {
        submitData.append('guardian_photo', formData.guardian_photo as string);
      }

      // 3. Append Standard Fields
      appendIfDefined('roll_number', formData.roll_number);
      appendIfDefined('first_name', formData.first_name);
      appendIfDefined('middle_name', formData.middle_name);
      appendIfDefined('last_name', formData.last_name);
      appendIfDefined('dob', formData.dob);
      appendIfDefined('gender', formData.gender);
      appendIfDefined('blood_group', formData.blood_group);

      appendIfDefined('father_name', formData.father_name);
      appendIfDefined('father_phone', formData.father_phone);
      appendIfDefined('father_email', formData.father_email);
      appendIfDefined('father_occupation', formData.father_occupation);
      appendIfDefined('father_office_address', formData.father_office_address);

      appendIfDefined('mother_name', formData.mother_name);
      appendIfDefined('mother_phone', formData.mother_phone);
      appendIfDefined('mother_email', formData.mother_email);
      appendIfDefined('mother_occupation', formData.mother_occupation);
      appendIfDefined('mother_office_address', formData.mother_office_address);

      appendIfDefined('guardian_name', formData.guardian_name);
      appendIfDefined('guardian_contact', formData.guardian_phone);
      appendIfDefined('guardian_email', formData.guardian_email);
      appendIfDefined('guardian_occupation', formData.guardian_occupation);
      appendIfDefined('guardian_office_address', formData.guardian_office_address);
      appendIfDefined('guardian_relation', formData.guardian_relation);

      appendIfDefined('street_address', formData.street_address);
      appendIfDefined('city', formData.city);
      appendIfDefined('state', formData.state);
      appendIfDefined('pin_code', formData.pin_code);
      appendIfDefined('emergency_contact', formData.emergency_contact);

      // Extra fields from work.txt / requirements
      appendIfDefined('id_no', formData.id_no); // Mapped to id_number in some backends, but formLinkController might not use it
      appendIfDefined('id_number', formData.id_no); // Send both keys just in case
      appendIfDefined('gr_no', formData.gr_no);
      appendIfDefined('gr_number', formData.gr_no);
      appendIfDefined('sr_no', formData.sr_no);
      appendIfDefined('sr_number', formData.sr_no);
      appendIfDefined('admission_no', formData.admission_no);
      appendIfDefined('admission_number', formData.admission_no);
      appendIfDefined('register_no', formData.register_no);
      appendIfDefined('registration_number', formData.register_no);
      appendIfDefined('bus_no', formData.bus_no);
      appendIfDefined('bus_number', formData.bus_no);

      // 4. Map Parent Details (Required by backend)
      // Default to Father, then Mother, then Guardian
      const parentName =
        formData.father_name || formData.mother_name || formData.guardian_name || '';
      const parentPhone =
        formData.father_phone || formData.mother_phone || formData.guardian_phone || '';
      const parentEmail =
        formData.father_email || formData.mother_email || formData.guardian_email || '';

      appendIfDefined('parent_name', parentName);
      appendIfDefined('parent_phone', parentPhone);
      appendIfDefined('parent_email', parentEmail);

      const url = formId
        ? `/api/form-links/public/${token}/submit?formId=${formId}&revision=${revision || ''
        }&token=${individualToken || ''}`
        : `/api/form-links/public/${token}/submit`;

      const response = await axiosInstance.post(url, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(
          formId
            ? t('publicForm.messages.correctionsSubmitted')
            : t('publicForm.messages.formSubmitted')
        );
        setStep(4); // Go to success step
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || t('publicForm.messages.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render image preview
  const renderImagePreview = (file: string | File, title: string = t('publicForm.messages.photoPreview')) => {
    if (!file)
      return (
        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center p-2">
          No Photo Uploaded
        </div>
      );

    const src = file instanceof File ? URL.createObjectURL(file) : file;

    return (
      <div
        className="relative group w-24 h-24 border-2 border-orange-100 rounded-lg overflow-hidden bg-gray-50 shadow-sm cursor-zoom-in transition-transform hover:scale-105"
        onClick={() => setViewingPhoto({ src, title })}
      >
        <img src={src} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  };

  // Helper function to get field correction status
  const getFieldStatus = (fieldName: string): 'correct' | 'needs-correction' | 'neutral' => {
    if (!formInfo?.fields_requiring_correction) return 'neutral';
    const status = formInfo.fields_requiring_correction[fieldName];
    if (status === true) return 'needs-correction';
    if (status === false) return 'correct';
    return 'neutral';
  };

  // Helper function to get correction note for field
  const getFieldCorrectionNote = (fieldName: string): string | null => {
    return formInfo?.correction_field_notes?.[fieldName] || null;
  };

  // Render input with visual indicators
  const renderFieldWithIndicator = (
    fieldName: keyof FormData,
    label: string,
    required: boolean = false,
    type: string = 'text',
    placeholder?: string,
    options?: { value: string; label: string }[],
    withCamera: boolean = true
  ) => {
    const isNeedsCorrection = getFieldStatus(fieldName) === 'needs-correction';
    const isCorrect = getFieldStatus(fieldName) === 'correct';
    const correctionNote = getFieldCorrectionNote(fieldName);
    const validationError = validationErrors[fieldName];

    // Common error/correction check for labels and icons
    const hasError = !!validationError || isNeedsCorrection;

    const labelContent = (
      <div className="flex items-center gap-2 mb-1">
        <label
          className={`text-sm font-medium ${hasError ? 'text-red-700' : isCorrect ? 'text-green-700' : 'text-gray-700'
            }`}
        >
          {label} {required && <span className="text-orange-600">*</span>}
        </label>
        {hasError && <XCircle className="w-4 h-4 text-red-600" />}
        {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600" />}
      </div>
    );

    const footerContent = (
      <>
        {/* Validation Error */}
        {validationError && (
          <p className="text-xs text-red-600 mt-1 font-medium">{validationError}</p>
        )}

        {/* Correction note hint */}
        {isNeedsCorrection && correctionNote && (
          <div className="mt-1 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{correctionNote}</p>
          </div>
        )}

        {/* Correct field indicator */}
        {isCorrect && (
          <div className="mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">{t('publicForm.validation.fieldCorrect')}</p>
          </div>
        )}
      </>
    );

    // Handling for Photo fields
    if (type === 'file') {
      return (
        <div className="flex flex-col gap-1">
          {labelContent}
          <PhotoUpload
            value={formData[fieldName]}
            onChange={(value) => handleChange(fieldName, value)}
            label={label}
            required={required}
            withCamera={withCamera}
            onViewPhoto={(src, title) => setViewingPhoto({ src, title })}
          />
          {footerContent}
        </div>
      );
    }

    // handling for State field (text input with suggestions)
    if (fieldName === 'state') {
      return (
        <div data-field="state" className="relative flex flex-col gap-1">
          {labelContent}
          <div className="relative">
            <Input
              type="text"
              value={formData[fieldName] as string}
              onChange={(e) => {
                handleChange(fieldName, e.target.value);
                setShowStateSuggestions(true);
              }}
              onFocus={() => setShowStateSuggestions(true)}
              placeholder={placeholder}
              className={`h-12 ${hasError
                ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                : isCorrect
                  ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                  : ''
                }`}
              style={{ height: '3.125rem' }}
            />
          </div>

          {showStateSuggestions && stateSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 top-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {stateSuggestions.map((state, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    handleChange(fieldName, state);
                    setShowStateSuggestions(false);
                  }}
                >
                  {state}
                </div>
              ))}
            </div>
          )}
          {footerContent}
        </div>
      );
    }

    // Handling for City field (text input with suggestions)
    if (fieldName === 'city') {
      return (
        <div data-field="city" className="relative flex flex-col gap-1">
          {labelContent}
          <div className="relative">
            <Input
              type="text"
              value={formData[fieldName] as string}
              onChange={(e) => {
                handleChange(fieldName, e.target.value);
                setShowCitySuggestions(true);
              }}
              onFocus={() => setShowCitySuggestions(true)}
              placeholder={placeholder}
              className={`h-12 ${hasError
                ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                : isCorrect
                  ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                  : ''
                }`}
              style={{ height: '3.125rem' }}
            />
          </div>

          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 top-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {citySuggestions.map((city, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    handleChange(fieldName, city);
                    setShowCitySuggestions(false);
                  }}
                >
                  {city}
                </div>
              ))}
            </div>
          )}
          {footerContent}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {labelContent}
        {type === 'select' && options ? (
          <Select
            value={formData[fieldName] as string}
            onValueChange={(value) => handleChange(fieldName, value)}
          >
            <SelectTrigger
              className={`h-12 ${hasError
                ? 'border-red-500 bg-red-50 focus:ring-red-500'
                : isCorrect
                  ? 'border-green-500 bg-green-50 focus:ring-green-500'
                  : ''
                }`}
              style={{ height: '3.125rem' }}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'textarea' ? (
          <textarea
            value={formData[fieldName] as string}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            className={`w-full border rounded-md p-3 h-24 ${hasError
              ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
              : isCorrect
                ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                : ''
              }`}
            placeholder={placeholder}
          />
        ) : (
          <Input
            type={type}
            value={formData[fieldName] as string}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className={`h-12 ${hasError
              ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
              : isCorrect
                ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500'
                : ''
              }`}
            style={{ height: '3.125rem' }}
          />
        )}
        {footerContent}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">{t('publicForm.loadingForm')}</p>
        </div>
      </div>
    );
  }

  if (!formInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('publicForm.invalidLinkTitle')}</h2>
          <p className="text-gray-600">{t('publicForm.invalidLinkDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#FF6A00' }}>
            {formInfo.requires_correction
              ? t('publicForm.formCorrectionRequired')
              : t('publicForm.studentRegistrationForm')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold">{formInfo.class_name}</span> | <span className="font-semibold">{formInfo.division}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {t('publicForm.fieldsMandatory')}
          </p>
        </div>

        {/* Correction Notice Banner */}
        {formInfo.requires_correction && formInfo.fields_requiring_correction && (
          <Alert className="mb-6 border-2 border-red-300 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-semibold text-base">
                  {t('publicForm.correctionNotice')}
                </p>
                {formInfo.correction_notes && (
                  <p className="text-sm mt-2 bg-white p-3 rounded border border-red-200">
                    <strong>{t('publicForm.generalNotes')}</strong> {formInfo.correction_notes}
                  </p>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">{t('publicForm.fieldsMarkedRed')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">{t('publicForm.fieldsMarkedGreen')}</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stepper */}
        {step !== 4 && (
          <div
            style={{
              width: '100%',
              marginTop: '2.5rem',
              marginBottom: '3rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Connecting Line Background */}
              <div
                className="bg-orange-100"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: window.innerWidth < 768 ? '20px' : '35px', // Center of 40px or 70px circle
                  height: '4px',
                  zIndex: 0,
                }}
              />

              {/* Active Connecting Line */}
              <div
                className="bg-orange-600 transition-all duration-300"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: window.innerWidth < 768 ? '20px' : '35px', // Center of 40px or 70px circle
                  height: '4px',
                  zIndex: 0,
                  width: `${(step / 4) * 100}%`,
                }}
              />

              {/* Steps */}
              {[0, 1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  onClick={() => goTo(s)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    position: 'relative',
                  }}
                >
                  <div
                    className={`flex items-center justify-center rounded-full font-bold transition-all duration-300 border-2 ${step === s
                      ? 'border-orange-600 bg-orange-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)] scale-110'
                      : step > s
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-orange-100 bg-white text-gray-500'
                      }`}
                    style={{
                      width: window.innerWidth < 768 ? '40px' : '70px',
                      height: window.innerWidth < 768 ? '40px' : '70px',
                      fontSize: window.innerWidth < 768 ? '1.25rem' : '1.875rem',
                    }}
                  >
                    {s + 1}
                  </div>
                  <p
                    className={`font-semibold ${step >= s ? 'text-black' : 'text-gray-400'}`}
                    style={{
                      marginTop: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
                      fontSize: window.innerWidth < 768 ? '0.75rem' : '1.125rem',
                    }}
                  >
                    {[t('publicForm.stepVerify'), t('publicForm.stepStudent'), t('publicForm.stepParents'), t('publicForm.stepPreview'), t('publicForm.stepSubmit')][s]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="mt-2 mb-6">
          {/* STEP 0 - VERIFY */}
          {step === 0 && (
            <div className="mb-10">
              <div className="bg-orange-50 border border-orange-300 p-2 rounded-lg mb-6">
                <div className="flex gap-4">
                  <div className="text-orange-600 text-xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#8B4513' }}>
                      {t('publicForm.verifyClassDetails')}
                    </h3>
                    <p className="text-sm text-orange-600 mt-1">
                      {t('publicForm.verifyClassMessage')}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg text-orange-600 mb-3">{t('publicForm.classDetails')}</h3>
              <div className="border-t mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {t('publicForm.classLabel')} <span className="text-orange-600">*</span>
                  </label>
                  <Input
                    value={formInfo?.class_name || ''}
                    disabled
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {t('publicForm.divisionLabel')} <span className="text-orange-600">*</span>
                  </label>
                  <Input
                    value={formInfo?.division || ''}
                    disabled
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">{t('publicForm.rollNumberLabel')}</label>
                  <Input
                    value={formData.roll_number}
                    onChange={(e) => handleChange('roll_number', e.target.value)}
                    placeholder={t('publicForm.rollNumberPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('publicForm.idNoLabel')}</label>
                  <Input
                    value={formData.id_no}
                    onChange={(e) => handleChange('id_no', e.target.value)}
                    placeholder={t('publicForm.idNoPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('publicForm.grNoLabel')}</label>
                  <Input
                    value={formData.gr_no}
                    onChange={(e) => handleChange('gr_no', e.target.value)}
                    placeholder={t('publicForm.grNoPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('publicForm.srNoLabel')}</label>
                  <Input
                    value={formData.sr_no}
                    onChange={(e) => handleChange('sr_no', e.target.value)}
                    placeholder={t('publicForm.srNoPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('publicForm.admissionNoLabel')}</label>
                  <Input
                    value={formData.admission_no}
                    onChange={(e) => handleChange('admission_no', e.target.value)}
                    placeholder={t('publicForm.admissionNoPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('publicForm.registerNoLabel')}</label>
                  <Input
                    value={formData.register_no}
                    onChange={(e) => handleChange('register_no', e.target.value)}
                    placeholder={t('publicForm.registerNoPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('publicForm.busNoLabel')}</label>
                  <Input
                    value={formData.bus_no}
                    onChange={(e) => handleChange('bus_no', e.target.value)}
                    placeholder={t('publicForm.busNoPlaceholder')}
                    className="border border-gray-300 bg-orange-50"
                  />
                </div>
              </div>

              <div className="flex justify-center mt-10 md:mt-16 pt-4">
                <Button
                  className="bg-green-600 text-white w-full md:max-w-md py-4 text-lg md:text-xl font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 h-auto"
                  onClick={() => setStep(1)}
                >
                  {t('publicForm.acceptContinue')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1 - STUDENT DETAILS */}
          {step === 1 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-orange-600">{t('publicForm.section1Student')}</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="grid grid-cols-1 gap-5">
                {/* Row 1: Names */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      windowWidth < 768 ? 'repeat(1, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {renderFieldWithIndicator(
                    'first_name',
                    t('publicForm.firstNameLabel'),
                    true,
                    'text',
                    t('publicForm.firstNamePlaceholder')
                  )}
                  {renderFieldWithIndicator(
                    'middle_name',
                    t('publicForm.middleNameLabel'),
                    true,
                    'text',
                    t('publicForm.middleNamePlaceholder')
                  )}
                  {renderFieldWithIndicator(
                    'last_name',
                    t('publicForm.lastNameLabel'),
                    true,
                    'text',
                    t('publicForm.lastNamePlaceholder')
                  )}
                </div>

                {/* Row 2: Basic Info */}
                <div
                  className="mt-6"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      windowWidth < 768 ? 'repeat(1, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {renderFieldWithIndicator('dob', t('publicForm.dobLabel'), true, 'date')}
                  {renderFieldWithIndicator('gender', t('publicForm.genderLabel'), true, 'select', t('publicForm.genderPlaceholder'), [
                    { value: 'Male', label: t('publicForm.genderOptions.male') },
                    { value: 'Female', label: t('publicForm.genderOptions.female') },
                    { value: 'Other', label: t('publicForm.genderOptions.other') },
                  ])}
                  {renderFieldWithIndicator(
                    'blood_group',
                    t('publicForm.bloodGroupLabel'),
                    true,
                    'select',
                    t('publicForm.bloodGroupPlaceholder'),
                    [
                      { value: 'A+', label: 'A+' },
                      { value: 'A-', label: 'A-' },
                      { value: 'B+', label: 'B+' },
                      { value: 'B-', label: 'B-' },
                      { value: 'AB+', label: 'AB+' },
                      { value: 'AB-', label: 'AB-' },
                      { value: 'O+', label: 'O+' },
                      { value: 'O-', label: 'O-' },
                    ]
                  )}
                </div>
                <div className="mt-6">
                  {renderFieldWithIndicator(
                    'street_address',
                    t('publicForm.addressLabel'),
                    true,
                    'textarea',
                    t('publicForm.addressPlaceholder')
                  )}
                </div>
                {/* City, State, PIN Row */}
                <div
                  className="mt-6"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      windowWidth < 768 ? 'repeat(1, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {/* {renderFieldWithIndicator(
                    'state',
                    'State',
                    true,
                    'select',
                    'Select state',
                    statesAndDistricts.states.map((s) => ({ value: s.state, label: s.state }))
                  )}
                  {renderFieldWithIndicator(
                    'city',
                    'City',
                    true,
                    'select',
                    'Select city',
                    cities.map((c) => ({ value: c, label: c }))
                  )} */}
                  {renderFieldWithIndicator('state', t('publicForm.stateLabel'), true, 'text', t('publicForm.statePlaceholder'))}
                  {renderFieldWithIndicator('city', t('publicForm.cityLabel'), true, 'text', t('publicForm.cityPlaceholder'))}
                  {renderFieldWithIndicator('pin_code', t('publicForm.pinCodeLabel'), true, 'text', t('publicForm.pinCodePlaceholder'))}
                </div>


                <div className="mt-6">
                  {renderFieldWithIndicator(
                    'emergency_contact',
                    t('publicForm.emergencyContactLabel'),
                    true,
                    'tel',
                    t('publicForm.emergencyContactPlaceholder')
                  )}
                </div>

                {/* <div className="mt-6">
                  {renderFieldWithIndicator('photo', 'Upload Student Photograph', true, 'file')}
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: JPG, PNG. Max size: 2MB
                  </p>
                </div> */}
                {renderFieldWithIndicator(
                  'photo',
                  t('publicForm.uploadPhotoLabel'),
                  true,
                  'file',
                  '',
                  undefined,
                  true // withCamera = true
                )}


              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 768 ? 'column-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  width: '100%',
                }}
              >
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {t('publicForm.back')}
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {t('publicForm.next')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 - PARENT DETAILS */}
          {step === 2 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-orange-600">{t('publicForm.parentDetailsTitle')}</h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="space-y-10">
                {/* Father's Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      {t('publicForm.fatherDetails')}
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithIndicator(
                      'father_name',
                      t('publicForm.fatherName'),
                      true,
                      'text',
                      t('publicForm.fatherNamePlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'father_phone',
                      t('publicForm.fatherContact'),
                      true,
                      'tel',
                      t('publicForm.fatherContactPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'father_email',
                      t('publicForm.fatherEmail'),
                      true,
                      'email',
                      t('publicForm.fatherEmailPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'father_occupation',
                      t('publicForm.fatherOccupation'),
                      false,
                      'select',
                      t('publicForm.occupationPlaceholder'),
                      occupationOptions
                    )}
                    <div className="md:col-span-2">
                      {renderFieldWithIndicator(
                        'father_office_address',
                        t('publicForm.fatherOfficeAddress'),
                        false,
                        'textarea',
                        t('publicForm.fatherOfficeAddressPlaceholder')
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {/* {renderFieldWithIndicator('father_photo', "Father's Photo", true, 'file')} */}
                        {renderFieldWithIndicator(
                          'father_photo',
                          t('publicForm.fatherPhoto'),
                          true,
                          'file',
                          '',
                          undefined,
                          true // withCamera = true
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mother's Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      {t('publicForm.motherDetails')}
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithIndicator(
                      'mother_name',
                      t('publicForm.motherName'),
                      true,
                      'text',
                      t('publicForm.motherNamePlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'mother_phone',
                      t('publicForm.motherContact'),
                      true,
                      'tel',
                      t('publicForm.motherContactPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'mother_email',
                      t('publicForm.motherEmail'),
                      true,
                      'email',
                      t('publicForm.motherEmailPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'mother_occupation',
                      t('publicForm.motherOccupation'),
                      false,
                      'select',
                      t('publicForm.occupationPlaceholder'),
                      occupationOptions
                    )}
                    <div className="md:col-span-2">
                      {renderFieldWithIndicator(
                        'mother_office_address',
                        t('publicForm.motherOfficeAddress'),
                        false,
                        'textarea',
                        t('publicForm.motherOfficeAddressPlaceholder')
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {/* {renderFieldWithIndicator('mother_photo', "Mother's Photo", true, 'file')} */}
                        {renderFieldWithIndicator(
                          'mother_photo',
                          t('publicForm.motherPhoto'),
                          true,
                          'file',
                          '',
                          undefined,
                          true // withCamera = true
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian's Details (Optional) */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-gray-400 rounded-full"></div>
                      {t('publicForm.guardianDetails')}{' '}
                      <span className="text-gray-500 font-normal text-sm ml-2">{t('publicForm.optional')}</span>
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithIndicator(
                      'guardian_name',
                      t('publicForm.guardianName'),
                      false,
                      'text',
                      t('publicForm.guardianNamePlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'guardian_phone',
                      t('publicForm.guardianContact'),
                      false,
                      'tel',
                      t('publicForm.guardianContactPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'guardian_email',
                      t('publicForm.guardianEmail'),
                      false,
                      'email',
                      t('publicForm.guardianEmailPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'guardian_relation',
                      t('publicForm.guardianRelation'),
                      false,
                      'text',
                      t('publicForm.guardianRelationPlaceholder')
                    )}
                    {renderFieldWithIndicator(
                      'guardian_occupation',
                      t('publicForm.guardianOccupation'),
                      false,
                      'select',
                      t('publicForm.occupationPlaceholder'),
                      occupationOptions
                    )}
                    <div className="md:col-span-2">
                      {renderFieldWithIndicator(
                        'guardian_office_address',
                        t('publicForm.guardianOfficeAddress'),
                        false,
                        'textarea',
                        t('publicForm.guardianOfficeAddressPlaceholder')
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {/* {renderFieldWithIndicator(
                          'guardian_photo',
                          "Guardian's Photo",
                          false,
                          'file'
                        )} */}
                        {renderFieldWithIndicator(
                          'guardian_photo',
                          t('publicForm.guardianPhoto'),
                          false,
                          'file',
                          '',
                          undefined,
                          true // withCamera = true
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 768 ? 'column-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  width: '100%',
                }}
              >
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {t('publicForm.back')}
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {t('publicForm.stepPreview')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 - PREVIEW */}
          {step === 3 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-orange-600">
                {t('publicForm.section3Preview')}
              </h3>
              <div className="border-t mt-1 mb-6" style={{ borderColor: '#FFA500' }}></div>

              <div className="space-y-8">
                {/* Class Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      {t('publicForm.classDetails')}
                    </h4>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('publicForm.classLabel')}:</span>{' '}
                      <span className="font-medium">{formInfo?.class_name || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.divisionLabel')}:</span>{' '}
                      <span className="font-medium">{formInfo?.division || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.rollNumberLabel')}:</span>{' '}
                      <span className="font-medium">{formData.roll_number || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.idNoLabel')}:</span>{' '}
                      <span className="font-medium">{formData.id_no || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.grNoLabel')}:</span>{' '}
                      <span className="font-medium">{formData.gr_no || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.srNoLabel')}:</span>{' '}
                      <span className="font-medium">{formData.sr_no || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.admissionNoLabel')}:</span>{' '}
                      <span className="font-medium">{formData.admission_no || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.registerNoLabel')}:</span>{' '}
                      <span className="font-medium">{formData.register_no || ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('publicForm.busNoLabel')}:</span>{' '}
                      <span className="font-medium">{formData.bus_no || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      {t('publicForm.stepStudent')} Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">{t('publicForm.photographLabel')}</p>
                      {renderImagePreview(formData.photo, t('publicForm.stepStudent') + ' ' + t('publicForm.photographLabel'))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm flex-grow">
                      <div>
                        <span className="text-gray-600">{t('publicForm.firstNameLabel')}:</span>{' '}
                        <span className="font-medium">{formData.first_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.middleNameLabel')}:</span>{' '}
                        <span className="font-medium">{formData.middle_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.lastNameLabel')}:</span>{' '}
                        <span className="font-medium">{formData.last_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.dobLabel')}:</span>{' '}
                        <span className="font-medium">{formData.dob}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.genderLabel')}:</span>{' '}
                        <span className="font-medium">{formData.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.bloodGroupLabel')}:</span>{' '}
                        <span className="font-medium">{formData.blood_group}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.cityLabel')}:</span>{' '}
                        <span className="font-medium">{formData.city}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.stateLabel')}:</span>{' '}
                        <span className="font-medium">{formData.state}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.pinCodeLabel')}:</span>{' '}
                        <span className="font-medium">{formData.pin_code}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-600">{t('publicForm.addressLabel')}:</span>{' '}
                        <span className="font-medium">{formData.street_address}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('publicForm.emergencyContactLabel')}:</span>{' '}
                        <span className="font-medium">{formData.emergency_contact}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent Details */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-orange-600 rounded-full"></div>
                      {t('publicForm.stepParents')} Details
                    </h4>
                  </div>
                  <div className="p-6 bg-white space-y-8">
                    {/* Father's Preview */}
                    <div className="border-l-4 border-orange-100 pl-4 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t('publicForm.photographLabel')}</p>
                        {renderImagePreview(formData.father_photo, t('publicForm.fatherPhoto'))}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">
                          {t('publicForm.fatherDetails')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">{t('common.name')}:</span>{' '}
                            <span className="font-medium">{formData.father_name || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('common.phone')}:</span>{' '}
                            <span className="font-medium">{formData.father_phone || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('common.email')}:</span>{' '}
                            <span className="font-medium">{formData.father_email || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('publicForm.fatherOccupation')}:</span>{' '}
                            <span className="font-medium">{formData.father_occupation || ''}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-600">{t('publicForm.fatherOfficeAddress')}:</span>{' '}
                            <span className="font-medium">
                              {formData.father_office_address || ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mother's Preview */}
                    <div className="border-l-4 border-orange-100 pl-4 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t('publicForm.photographLabel')}</p>
                        {renderImagePreview(formData.mother_photo, t('publicForm.motherPhoto'))}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">
                          {t('publicForm.motherDetails')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">{t('common.name')}:</span>{' '}
                            <span className="font-medium">{formData.mother_name || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('common.phone')}:</span>{' '}
                            <span className="font-medium">{formData.mother_phone || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('common.email')}:</span>{' '}
                            <span className="font-medium">{formData.mother_email || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('publicForm.motherOccupation')}:</span>{' '}
                            <span className="font-medium">{formData.mother_occupation || ''}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-600">{t('publicForm.motherOfficeAddress')}:</span>{' '}
                            <span className="font-medium">
                              {formData.mother_office_address || ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian's Preview */}
                    <div className="border-l-4 border-gray-100 pl-4 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t('publicForm.photographLabel')}</p>
                        {renderImagePreview(formData.guardian_photo, t('publicForm.guardianPhoto'))}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">
                          {t('publicForm.guardianDetails')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">{t('common.name')}:</span>{' '}
                            <span className="font-medium">{formData.guardian_name || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('common.phone')}:</span>{' '}
                            <span className="font-medium">{formData.guardian_phone || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('common.email')}:</span>{' '}
                            <span className="font-medium">{formData.guardian_email || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('publicForm.guardianRelation')}:</span>{' '}
                            <span className="font-medium">{formData.guardian_relation || ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('publicForm.guardianOccupation')}:</span>{' '}
                            <span className="font-medium">
                              {formData.guardian_occupation || ''}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-600">{t('publicForm.guardianOfficeAddress')}:</span>{' '}
                            <span className="font-medium">
                              {formData.guardian_office_address || ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 768 ? 'column-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  marginBottom: '1.5rem',
                  width: '100%',
                }}
              >
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {t('publicForm.back')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-lg md:text-xl font-semibold"
                  style={{
                    width: windowWidth < 768 ? '100%' : 'auto',
                    minWidth: windowWidth >= 768 ? '200px' : 'unset',
                    height: 'auto',
                    minHeight: windowWidth < 768 ? '50px' : '55px',
                  }}
                >
                  {isSubmitting ? t('publicForm.submitting') : t('publicForm.submit')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 - SUCCESS */}
          {step === 4 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-24 h-24 mx-auto mb-6 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {t('publicForm.successMessage')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('publicForm.thankYouMessage')}
              </p>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                {t('publicForm.siblingFormMessage')}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-sm text-gray-700">
                  <strong>{t('publicForm.classLabel')}:</strong> {formInfo?.class_name} | <strong>{t('publicForm.divisionLabel')}:</strong>{' '}
                  {formInfo?.division}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>{t('publicForm.studentLabel')}:</strong> {formData.first_name} {formData.last_name}
                </p>
                {formData.roll_number && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>{t('publicForm.rollNumberLabel')}:</strong> {formData.roll_number}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogPortal>
          <DialogOverlay
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
            }}
          />
          <DialogPrimitive.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              maxWidth: '56rem',
              width: '100%',
              height: '90vh',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              <DialogTitle
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: '0',
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: '0',
                }}
              >
                {t('publicForm.photographLabel')} Viewer
              </DialogTitle>

              {/* Image Container */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                  backgroundColor: '#000',
                  border: '4px solid #fff',
                }}
              >
                <img
                  src={viewingPhoto?.src}
                  alt="Preview"
                  style={{
                    maxHeight: '75vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>

              {/* Bottom Close Button */}
              <Button
                onClick={() => setViewingPhoto(null)}
                style={{
                  backgroundColor: '#ea8600', // Using the orange color from your theme
                  color: '#ffffff',
                  paddingLeft: '3rem',
                  paddingRight: '3rem',
                  paddingTop: '1.5rem',
                  paddingBottom: '1.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '9999px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s ease-in-out',
                  transform: 'scale(1)',
                  cursor: 'pointer',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c27000'; // Darker orange on hover
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ea8600';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
              >
                {t('common.close')}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
