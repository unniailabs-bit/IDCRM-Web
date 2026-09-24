import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import {
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  Users,
  Clock,
  AlertCircle,
  Pencil,
  Save,
  X,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { FormLinkManager } from './FormLinkManager';
import { CustomDialog } from './CustomDialog';
import { useTranslation } from 'react-i18next';

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

export interface StudentForm {
  id: string;
  rollNo: string;
  studentName: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  class: string;
  division: string;
  fatherName: string;
  father_phone?: string;
  father_email?: string;
  father_photo?: string;
  father_occupation?: string;
  father_office_address?: string;
  motherName: string;
  mother_phone?: string;
  mother_email?: string;
  mother_photo?: string;
  mother_occupation?: string;
  mother_office_address?: string;
  guardian_name?: string;
  guardian_contact?: string;
  guardian_email?: string;
  guardian_photo?: string;
  guardian_occupation?: string;
  guardian_office_address?: string;
  guardian_relation?: string;
  address: string;
  dob?: string;
  street_address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  submittedOn: string;
  status: 'Pending' | 'approved' | 'Rejected';
  photo?: string;
  gender?: string;
  blood_group?: string;
  id_number?: string;
  gr_number?: string;
  sr_number?: string;
  admission_number?: string;
  registration_number?: string;
  bus_number?: string;
  emergency_contact?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  daysWaiting: number;
  sign?: string;
}

const EditableField = ({
  label,
  value,
  name,
  isEditing,
  onChange,
  type = 'text',
  placeholder = '',
  options,
}: {
  label: string;
  value: any;
  name: string;
  isEditing: boolean;
  onChange: (name: string, value: string | null) => void;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}) => (
  <div>
    <p
      style={{
        fontSize: '9px',
        fontWeight: 700,
        color: '#64748b',
        marginBottom: '2px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </p>
    {isEditing ? (
      type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          style={{ fontWeight: 600, color: '#1f2937', backgroundColor: '#fff' }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          placeholder={placeholder}
          className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          style={{ fontWeight: 600, color: '#1f2937', backgroundColor: '#fff' }}
          onChange={(e) => onChange(name, e.target.value)}
        />
      )
    ) : (
      <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>{value || '—'}</p>
    )}
  </div>
);

export function StudentForms() {
  const { t } = useTranslation();

  const genderOptions = [
    { value: 'Male', label: t('studentForms.genderOptions.male') },
    { value: 'Female', label: t('studentForms.genderOptions.female') },
    { value: 'Other', label: t('studentForms.genderOptions.other') },
  ];

  const occupationOptions = [
    { value: 'Business', label: t('studentForms.occupationOptions.business') },
    { value: 'Service', label: t('studentForms.occupationOptions.service') },
    { value: 'Self Employed', label: t('studentForms.occupationOptions.selfEmployed') },
    { value: 'Retired', label: t('studentForms.occupationOptions.retired') },
    { value: 'Housewife', label: t('studentForms.occupationOptions.housewife') },
  ];

  const [forms, setForms] = useState<StudentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedForm, setSelectedForm] = useState<StudentForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StudentForm>>({});
  const [newFiles, setNewFiles] = useState<Record<string, File>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setNewFiles((prev) => ({ ...prev, [name]: file }));
    }
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const token = localStorage.getItem('token');

  const onFieldChange = (name: string, value: string | null) => {
    if (name === 'state') {
      setEditData((prev) => ({ ...prev, state: value || '', city: '' }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (editData.state) {
      const stateData = statesAndDistricts.states.find((s) => s.state === editData.state);
      if (stateData) {
        setCities(stateData.districts);
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [editData.state]);

  const handleUpdate = async (nextStatus?: string) => {
    if (!selectedForm) return;
    try {
      const formData = new FormData();

      // Mapping of frontend field names to backend field names
      const fieldMapping: Record<string, string> = {
        rollNo: 'roll_number',
        fatherName: 'father_name',
        motherName: 'mother_name',
        sign: 'student_signature',
        photo: 'photo',
      };

      const excludedFields = [
        'id',
        'studentName',
        'submittedOn',
        'daysWaiting',
        'class',
        'division',
        'father_photo',
        'mother_photo',
        'guardian_photo'
      ];

      // Append text data
      Object.entries(editData).forEach(([key, value]) => {
        // Skip status if we are overriding it with nextStatus
        if (key === 'status' && nextStatus) return;

        // Skip excluded fields and fields that are handled as files (unless they were not changed)
        if (excludedFields.includes(key)) return;

        if (value !== null && value !== undefined) {
          // Only append if it's not a URL (prevents sending old image URLs as strings)
          if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
            return;
          }

          const backendKey = fieldMapping[key] || key;
          formData.append(backendKey, String(value));
        }
      });

      // If we are also updating status (e.g. from Approve/Reject buttons in edit mode)
      if (nextStatus) {
        formData.append('status', nextStatus.toLowerCase());
      }

      // Append files
      Object.entries(newFiles).forEach(([name, file]) => {
        const backendKey = fieldMapping[name] || name;
        formData.append(backendKey, file as Blob);
      });

      const resp = await axiosInstance.patch(
        `/api/teacher/student-forms/${selectedForm.id}/update`,
        formData
      );

      if (resp.data.success) {
        // Map backend response to frontend StudentForm interface
        const updatedForm = mapFormItem(resp.data.data);

        // Update list and selection immediately
        setForms((prev) => prev.map((f) => (f.id === selectedForm.id ? updatedForm : f)));
        setSelectedForm(updatedForm);

        setIsEditing(false);
        setNewFiles({});
        toast.success(
          nextStatus
            ? t('studentForms.updateAndStatusSuccess', { status: nextStatus.toLowerCase() })
            : t('studentForms.updateSuccess')
        );
        if (nextStatus) {
          setIsDialogOpen(false);
        }
        // No need to fetch again as we already have mapped the response
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('studentForms.failedUpdate'));
    }
  };
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const resolveImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  const mapFormItem = (item: any): StudentForm => ({
    id: item.id.toString(),
    rollNo: item.roll_number,
    first_name: item.first_name,
    middle_name: item.middle_name,
    last_name: item.last_name,
    studentName: `${item.first_name} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name
      }`,
    class: item.class_name,
    division: item.division_name,
    fatherName: item.father_name,
    father_phone: item.father_phone,
    father_email: item.father_email,
    father_photo: resolveImageUrl(item.father_photo),
    father_occupation: item.father_occupation,
    father_office_address: item.father_office_address,
    motherName: item.mother_name,
    mother_phone: item.mother_phone,
    mother_email: item.mother_email,
    mother_photo: resolveImageUrl(item.mother_photo),
    mother_occupation: item.mother_occupation,
    mother_office_address: item.mother_office_address,
    guardian_name: item.guardian_name,
    guardian_contact: item.guardian_contact,
    guardian_email: item.guardian_email,
    guardian_photo: resolveImageUrl(item.guardian_photo),
    guardian_occupation: item.guardian_occupation,
    guardian_office_address: item.guardian_office_address,
    guardian_relation: item.guardian_relation,
    dob: item.dob,
    address: item.address,
    street_address: item.street_address,
    city: item.city,
    state: item.state,
    pin_code: item.pin_code,
    submittedOn: new Date(item.created_at).toLocaleString(),
    photo: resolveImageUrl(item.photo),
    gender: item.gender,
    blood_group: item.blood_group,
    id_number: item.id_number,
    gr_number: item.gr_number,
    sr_number: item.sr_number,
    admission_number: item.admission_number,
    registration_number: item.registration_number,
    bus_number: item.bus_number,
    emergency_contact: item.emergency_contact,
    parent_name: item.parent_name,
    parent_phone: item.parent_phone,
    parent_email: item.parent_email,
    sign: resolveImageUrl(item.sign || item.signature || item.signature_url || item.student_signature),
    daysWaiting: Math.floor(
      (new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
    ),
    status:
      item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'Rejected' : 'Pending',
  });

  // 👉 Fetch Submissions Data
  const fetchForms = async () => {
    try {
      const res = await axiosInstance.get(`/api/teacher/student-forms`);
      const formattedData = res.data.data.map((item: any) => mapFormItem(item));
      setForms(formattedData);
    } catch (error) {
      console.error(t('studentForms.fetchError'), error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const resp = await axiosInstance.get('/api/teacher/myclass/dashboard');
      if (resp.data.success && resp.data.data?.divisions) {
        const uniqueDivisions = Array.from(
          new Set(resp.data.data.divisions.map((d: any) => d.division_name))
        ) as string[];
        setAvailableDivisions(uniqueDivisions.sort());
      }
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchDivisions();
  }, []);

  const handleApprove = async (formId: string) => {
    try {
      const resp = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'approved',
      });
      if (resp.data.success) {
        toast.success(t('studentForms.approveSuccess'));
        setForms(forms.map((f) => (f.id === formId ? { ...f, status: 'approved' } : f)));
        setIsDialogOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('studentForms.failedApprove'));
    }
  };

  const handleReject = async (formId: string) => {
    try {
      const resp = await axiosInstance.patch(`/api/teacher/student-forms/${formId}`, {
        status: 'rejected',
      });
      if (resp.data.success) {
        toast.success(t('studentForms.rejectSuccess'));
        setForms(forms.map((f) => (f.id === formId ? { ...f, status: 'Rejected' } : f)));
        setIsDialogOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('studentForms.failedReject'));
    }
  };

  // ── Selection Logic ──────────────────────────────────────────
  const toggleSelection = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredForms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredForms.map((f) => f.id)));
    }
  };

  // ── Bulk Delete ───────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await axiosInstance.post('/api/teacher/student-forms/delete-bulk', { ids });
      setForms((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      const count = selectedIds.size;
      setSelectedIds(new Set());
      setIsDeleteConfirmOpen(false);
      toast.success(`${count} forms deleted successfully.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk delete failed.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const filteredForms = forms.filter((form) => {
    if (filterClass !== 'all' && form.division !== filterClass) return false;
    if (filterStatus !== 'all' && form.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = forms.filter((f) => f.status === 'Pending').length;
  const approvedCount = forms.filter((f) => f.status === 'approved').length;

  if (loading) return <p className="p-6 text-center">{t('studentForms.loading')}</p>;

  return (
    <div className="px-8 py-5 md:px-8 md:py-5 h-dvh mx-auto bg-white">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('studentForms.title')}</h1>
        <p className="text-base md:text-lg text-gray-600 font-medium">
          {t('studentForms.subtitle')}
        </p>
      </div>

      {/* Form Link Manager */}
      <div className="mb-6">
        <FormLinkManager />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border rounded-2xl shadow-md bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-lg text-gray-600">{t('studentForms.totalSubmissions')}</p>
            <p className="text-2xl font-bold">{forms.length}</p>
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-md bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-lg text-gray-600">{t('studentForms.pendingReview')}</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-md bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-lg text-gray-600">{t('studentForms.approved')}</p>
            <p className="text-2xl font-bold">{approvedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 border rounded-2xl shadow-md bg-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm">{t('studentForms.filters')}</span>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[180px] border border-gray-300">
                <SelectValue placeholder={t('studentForms.allDivisions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studentForms.allDivisions')}</SelectItem>
                {availableDivisions.map((div) => (
                  <SelectItem key={div} value={div}>
                    {t('studentForms.division')} {div}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] border border-gray-300">
                <SelectValue placeholder={t('studentForms.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('studentForms.allStatus')}</SelectItem>
                <SelectItem value="Pending">{t('studentForms.pendingReview')}</SelectItem>
                <SelectItem value="approved">{t('studentForms.approved')}</SelectItem>
                <SelectItem value="Rejected">{t('studentForms.rejected')}</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size > 0 && (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-sm ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.size})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {t('studentForms.formSubmissions', { count: filteredForms.length })}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto px-10">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center">
                    <button
                      onClick={toggleAll}
                      className="flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      {filteredForms.length > 0 && selectedIds.size === filteredForms.length ? (
                        <CheckSquare size={18} className="text-indigo-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>{t('studentForms.rollNo')}</TableHead>
                  <TableHead className="w-[160px]">{t('studentForms.name')}</TableHead>
                  <TableHead>{t('studentForms.class')}</TableHead>
                  <TableHead>{t('studentForms.division')}</TableHead>
                  <TableHead className="w-[160px]">{t('studentForms.father')}</TableHead>
                  <TableHead className="w-[140px]">{t('studentForms.submittedOn')}</TableHead>
                  <TableHead>{t('studentForms.status')}</TableHead>
                  <TableHead>{t('studentForms.actions')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="text-center">
                      <button
                        onClick={() => toggleSelection(form.id)}
                        className={`flex items-center justify-center cursor-pointer transition-colors ${selectedIds.has(form.id) ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-400'}`}
                      >
                        {selectedIds.has(form.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </TableCell>
                    <TableCell>{form.rollNo}</TableCell>
                    <TableCell className="w-[160px]">
                      <span className="block truncate" title={form.studentName}>
                        {form.studentName}
                      </span>
                    </TableCell>
                    <TableCell>{form.class}</TableCell>
                    <TableCell>{form.division}</TableCell>
                    <TableCell className="w-[160px]">
                      <span className="block truncate" title={form.fatherName}>
                        {form.fatherName}
                      </span>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <span className="block truncate text-sm" title={form.submittedOn}>
                        {form.submittedOn}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] font-bold border
                                  ${form.status === 'approved'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : form.status === 'Rejected'
                              ? 'bg-red-100 text-red-400 border-red-200'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          }
                                `}
                      >
                        {t(`studentForms.${form.status === 'approved' ? 'approved' : form.status === 'Rejected' ? 'rejected' : 'pendingReview'}`).toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Eye
                          className="cursor-pointer text-gray-400 hover:text-gray-600 w-5 h-5 ml-2"
                          onClick={() => {
                            setSelectedForm(form);
                            setIsEditing(false);
                            setIsDialogOpen(true);
                          }}
                        />

                        <Pencil
                          className="cursor-pointer text-blue-400 hover:text-green-600 w-5 h-5 ml-2"
                          onClick={() => {
                            setSelectedForm(form);
                            setEditData(form);
                            setIsEditing(true);
                            setIsDialogOpen(true);
                          }}
                        />

                        {form.status === 'Pending' && (
                          <>
                            <CheckCircle
                              className="text-green-600 cursor-pointer"
                              onClick={() => handleApprove(form.id)}
                            />
                            <XCircle
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleReject(form.id)}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>



      {/* ── Delete Confirmation Dialog ── */}
      {
        isDeleteConfirmOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteConfirmOpen(false); }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{t('studentForms.deleteConfirmTitle')}</h3>
                  <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                    {t('studentForms.deleteConfirmDesc', { count: selectedIds.size })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={isBulkDeleting}
                  className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('studentForms.cancel')}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-60 active:scale-95"
                >
                  {isBulkDeleting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('studentForms.deleting')}</>
                  ) : (
                    <><Trash2 className="w-4 h-4" />{t('studentForms.deleteAction', { count: selectedIds.size })}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Custom Details Dialog */}
      <CustomDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        {selectedForm && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                background: 'linear-gradient(to right, #1f2937, #374151, #4b5563)',
                padding: '24px',
              }}
              className="text-white relative overflow-hidden"
            >
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

              <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative group">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      transition: 'transform 0.2s ease-in-out',
                      position: 'relative',
                    }}
                  >
                    {newFiles.photo ? (
                      <img
                        src={URL.createObjectURL(newFiles.photo)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : selectedForm.photo ? (
                      <img
                        src={selectedForm.photo}
                        alt={selectedForm.studentName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-student.png';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <Users style={{ width: '48px', height: '48px', color: '#d1d5db' }} />
                      </div>
                    )}

                    {isEditing && (
                      <label
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        className="hover:bg-black/60"
                      >
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                        />
                        <Pencil
                          style={{
                            width: '24px',
                            height: '24px',
                            color: '#fff',
                            marginBottom: '4px',
                          }}
                        />
                        <p style={{ color: '#fff', fontSize: '9px', fontWeight: 800 }}>
                          {t('studentForms.changePhoto')}
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}
                  >
                    <h2
                      style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        letterSpacing: '-0.025em',
                        color: '#ffffff',
                        margin: 0,
                      }}
                    >
                      {selectedForm.studentName}
                    </h2>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(12px)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Clock style={{ width: '12px', height: '12px' }} /> {t('studentForms.pendingReviewBadge')}
                    </div>
                    <div
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {t('studentForms.waitingDays', { days: selectedForm.daysWaiting })}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>
                        {t('studentForms.classLabel')}
                      </span>
                      <span>
                        {selectedForm.class} - {selectedForm.division}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>{t('studentForms.rollLabel')}</span>
                      <span>{selectedForm.rollNo || t('common.na')}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ opacity: 0.7, fontSize: '10px', fontWeight: 700 }}>
                        {t('studentForms.bloodLabel')}
                      </span>
                      <span style={{ fontWeight: 700 }}>{selectedForm.blood_group || t('common.na')}</span>
                    </div>
                  </div>

                  {/* signature section and pending approval link */}
                  <div
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        backdropFilter: 'blur(4px)',
                        height: '50px',
                        width: '150px',
                      }}
                    >
                      {newFiles.sign ? (
                        <img
                          src={URL.createObjectURL(newFiles.sign)}
                          alt="New Signature"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : selectedForm.sign ? (
                        <img
                          src={selectedForm.sign}
                          alt="Signature"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-sign.png';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: '8px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 800,
                          }}
                        >
                          {t('studentForms.noSignature')}
                        </div>
                      )}

                      {isEditing && (
                        <label
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '8px',
                          }}
                        >
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleFileChange('sign', e.target.files?.[0] || null)}
                          />
                          <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                        </label>
                      )}
                    </div>


                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px' }} className="space-y-8">
              {/* Urgent Alert if needed */}
              {selectedForm.daysWaiting >= 5 && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    borderLeft: '4px solid #ef4444',
                    padding: '12px',
                  }}
                  className="rounded-lg flex items-center gap-3 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-red-800 font-bold text-xs uppercase tracking-wider leading-none mb-1">
                      {t('studentForms.criticalAttention')}
                    </p>
                    <p className="text-red-600 text-[10px]">
                      {t('studentForms.exceededWindow')}
                    </p>
                  </div>
                </div>
              )}

              {/* Secondary Info Grid */}
              <div>
                <h3
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      height: '12px',
                      width: '4px',
                      backgroundColor: '#4b5563',
                      borderRadius: '9999px',
                    }}
                  ></div>
                  {t('studentForms.registrySchoolDetails')}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {[
                    { label: t('studentForms.rollNo').toUpperCase(), value: selectedForm.rollNo, name: 'rollNo' },
                    { label: t('studentForms.idNumber').toUpperCase(), value: selectedForm.id_number, name: 'id_number' },
                    { label: t('studentForms.grNumber').toUpperCase(), value: selectedForm.gr_number, name: 'gr_number' },
                    { label: t('studentForms.srNumber').toUpperCase(), value: selectedForm.sr_number, name: 'sr_number' },
                    {
                      label: t('studentForms.admission_number').toUpperCase(),
                      value: selectedForm.admission_number,
                      name: 'admission_number',
                    },
                    {
                      label: t('studentForms.registration_number').toUpperCase(),
                      value: selectedForm.registration_number,
                      name: 'registration_number',
                    },
                    { label: t('studentForms.bus_number').toUpperCase(), value: selectedForm.bus_number, name: 'bus_number' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: 'rgba(249, 250, 251, 0.5)',
                        border: '1px solid #f3f4f6',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#9ca3af',
                          marginBottom: '2px',
                        }}
                      >
                        {item.label}
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editData as any)[item.name] || ''}
                          className="w-full text-xs p-1 border rounded bg-white"
                          onChange={(e) => onFieldChange(item.name, e.target.value)}
                        />
                      ) : (
                        <p style={{ fontWeight: 700, color: '#374151', fontSize: '14px' }}>
                          {item.value || t('common.na')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '32px',
                }}
              >
                {/* Personal Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        width: '4px',
                        backgroundColor: '#64748b',
                        borderRadius: '9999px',
                      }}
                    ></div>
                    {t('studentForms.personalDetails')}
                  </h3>
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      <EditableField
                        label={t('studentForms.first_name')}
                        value={isEditing ? editData.first_name : selectedForm.first_name}
                        name="first_name"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.middle_name')}
                        value={isEditing ? editData.middle_name : selectedForm.middle_name}
                        name="middle_name"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.last_name')}
                        value={isEditing ? editData.last_name : selectedForm.last_name}
                        name="last_name"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.birthDate')}
                        value={isEditing ? editData.dob : selectedForm.dob}
                        name="dob"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                        type="date"
                      />
                      <EditableField
                        label={t('studentForms.gender')}
                        value={isEditing ? editData.gender : selectedForm.gender}
                        name="gender"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                        type="select"
                        options={genderOptions}
                        placeholder={t('studentForms.allStatus')}
                      />
                      <EditableField
                        label={t('studentForms.bloodGroup')}
                        value={isEditing ? editData.blood_group : selectedForm.blood_group}
                        name="blood_group"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.emergency')}
                        value={
                          isEditing ? editData.emergency_contact : selectedForm.emergency_contact
                        }
                        name="emergency_contact"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                      />
                      <EditableField
                        label={t('studentForms.state')}
                        value={isEditing ? editData.state : selectedForm.state}
                        name="state"
                        isEditing={isEditing}
                        onChange={onFieldChange}
                        type="select"
                        options={statesAndDistricts.states.map((s) => ({
                          value: s.state,
                          label: s.state,
                        }))}
                        placeholder={t('studentForms.allDivisions')}
                      />
                    </div>

                    <div
                      style={{
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {t('studentForms.addressInformation')}
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ gridColumn: 'span 2' }}>
                          <EditableField
                            label={t('studentForms.streetAddress')}
                            value={
                              isEditing ? editData.street_address : selectedForm.street_address
                            }
                            name="street_address"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                        </div>
                        <EditableField
                          label={t('studentForms.city')}
                          value={isEditing ? editData.city : selectedForm.city}
                          name="city"
                          isEditing={isEditing}
                          onChange={onFieldChange}
                          type="select"
                          options={cities.map((c) => ({ value: c, label: c }))}
                          placeholder={t('studentForms.allStatus')}
                        />
                        <EditableField
                          label={t('studentForms.pinCode')}
                          value={isEditing ? editData.pin_code : selectedForm.pin_code}
                          name="pin_code"
                          isEditing={isEditing}
                          onChange={onFieldChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parents Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        width: '4px',
                        backgroundColor: '#1f2937',
                        borderRadius: '9999px',
                      }}
                    ></div>
                    {t('studentForms.familyOverview')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {/* Father Card */}
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #f3f4f6',
                          position: 'relative',
                        }}
                      >
                        {newFiles.father_photo ? (
                          <img
                            src={URL.createObjectURL(newFiles.father_photo)}
                            alt="New Father"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : selectedForm.father_photo ? (
                          <img
                            src={selectedForm.father_photo}
                            alt="Father"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyItems: 'center',
                              fontSize: '10px',
                              color: '#d1d5db',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '-0.05em',
                            }}
                          >
                            {t('studentForms.photo')}
                          </div>
                        )}

                        {isEditing && (
                          <label
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              borderRadius: '8px',
                            }}
                            className="hover:bg-black/80"
                          >
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={(e) =>
                                handleFileChange('father_photo', e.target.files?.[0] || null)
                              }
                            />
                            <div
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '6px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.4)',
                              }}
                            >
                              <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                            </div>
                          </label>
                        )}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <p
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            color: '#4b5563',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t('studentForms.fatherDetails')}
                        </p>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          <EditableField
                            label={t('studentForms.name')}
                            value={isEditing ? editData.fatherName : selectedForm.fatherName}
                            name="fatherName"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.emergency')}
                            value={isEditing ? editData.father_phone : selectedForm.father_phone}
                            name="father_phone"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.email')}
                            value={isEditing ? editData.father_email : selectedForm.father_email}
                            name="father_email"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.occupation')}
                            value={
                              isEditing
                                ? editData.father_occupation
                                : selectedForm.father_occupation
                            }
                            name="father_occupation"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                            type="select"
                            options={occupationOptions}
                            placeholder={t('studentForms.allStatus')}
                          />
                          <div style={{ gridColumn: '1 / -1' }}>
                            <EditableField
                              label={t('studentForms.officeAddress')}
                              value={
                                isEditing
                                  ? editData.father_office_address
                                  : selectedForm.father_office_address
                              }
                              name="father_office_address"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mother Card */}
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #f3f4f6',
                          position: 'relative',
                        }}
                      >
                        {newFiles.mother_photo ? (
                          <img
                            src={URL.createObjectURL(newFiles.mother_photo)}
                            alt="New Mother"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : selectedForm.mother_photo ? (
                          <img
                            src={selectedForm.mother_photo}
                            alt="Mother"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyItems: 'center',
                              fontSize: '10px',
                              color: '#d1d5db',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '-0.05em',
                            }}
                          >
                            {t('studentForms.photo')}
                          </div>
                        )}

                        {isEditing && (
                          <label
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              borderRadius: '8px',
                            }}
                            className="hover:bg-black/80"
                          >
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={(e) =>
                                handleFileChange('mother_photo', e.target.files?.[0] || null)
                              }
                            />
                            <div
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '6px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.4)',
                              }}
                            >
                              <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                            </div>
                          </label>
                        )}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <p
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            color: '#6b7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t('studentForms.motherDetails')}
                        </p>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          <EditableField
                            label={t('studentForms.name')}
                            value={isEditing ? editData.motherName : selectedForm.motherName}
                            name="motherName"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.emergency')}
                            value={isEditing ? editData.mother_phone : selectedForm.mother_phone}
                            name="mother_phone"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.email')}
                            value={isEditing ? editData.mother_email : selectedForm.mother_email}
                            name="mother_email"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                          />
                          <EditableField
                            label={t('studentForms.occupation')}
                            value={
                              isEditing
                                ? editData.mother_occupation
                                : selectedForm.mother_occupation
                            }
                            name="mother_occupation"
                            isEditing={isEditing}
                            onChange={onFieldChange}
                            type="select"
                            options={occupationOptions}
                            placeholder={t('studentForms.allStatus')}
                          />
                          <div style={{ gridColumn: '1 / -1' }}>
                            <EditableField
                              label={t('studentForms.officeAddress')}
                              value={
                                isEditing
                                  ? editData.mother_office_address
                                  : selectedForm.mother_office_address
                              }
                              name="mother_office_address"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian if exists */}
                    {selectedForm.guardian_name && (
                      <div
                        style={{
                          backgroundColor: '#fff',
                          border: '2px solid #f1f5f9',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          gap: '12px',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid #f3f4f6',
                            position: 'relative',
                          }}
                        >
                          {newFiles.guardian_photo ? (
                            <img
                              src={URL.createObjectURL(newFiles.guardian_photo)}
                              alt="New Guardian"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : selectedForm.guardian_photo ? (
                            <img
                              src={selectedForm.guardian_photo}
                              alt="Guardian"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyItems: 'center',
                                fontSize: '10px',
                                color: '#d1d5db',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '-0.05em',
                              }}
                            >
                              {t('studentForms.photo')}
                            </div>
                          )}

                          {isEditing && (
                            <label
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                borderRadius: '8px',
                              }}
                              className="hover:bg-black/80"
                            >
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileChange('guardian_photo', e.target.files?.[0] || null)
                                }
                              />
                              <div
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  padding: '6px',
                                  borderRadius: '50%',
                                  border: '1px solid rgba(255,255,255,0.4)',
                                }}
                              >
                                <Pencil style={{ width: '16px', height: '16px', color: '#fff' }} />
                              </div>
                            </label>
                          )}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <p
                            style={{
                              fontSize: '9px',
                              fontWeight: 900,
                              color: '#9ca3af',
                              marginBottom: '8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('studentForms.guardianDetails')} ({selectedForm.guardian_relation})
                          </p>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '12px',
                            }}
                          >
                            <EditableField
                              label={t('studentForms.name')}
                              value={
                                isEditing ? editData.guardian_name : selectedForm.guardian_name
                              }
                              name="guardian_name"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.relation')}
                              value={
                                isEditing
                                  ? editData.guardian_relation
                                  : selectedForm.guardian_relation
                              }
                              name="guardian_relation"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.emergency')}
                              value={
                                isEditing
                                  ? editData.guardian_contact
                                  : selectedForm.guardian_contact
                              }
                              name="guardian_contact"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.email')}
                              value={
                                isEditing ? editData.guardian_email : selectedForm.guardian_email
                              }
                              name="guardian_email"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                            />
                            <EditableField
                              label={t('studentForms.occupation')}
                              value={
                                isEditing
                                  ? editData.guardian_occupation
                                  : selectedForm.guardian_occupation
                              }
                              name="guardian_occupation"
                              isEditing={isEditing}
                              onChange={onFieldChange}
                              type="select"
                              options={occupationOptions}
                              placeholder={t('studentForms.allStatus')}
                            />
                            <div style={{ gridColumn: '1 / -1' }}>
                              <EditableField
                                label={t('studentForms.officeAddress')}
                                value={
                                  isEditing
                                    ? editData.guardian_office_address
                                    : selectedForm.guardian_office_address
                                }
                                name="guardian_office_address"
                                isEditing={isEditing}
                                onChange={onFieldChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '24px',
                  paddingBottom: '24px',
                }}
              >
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#64748b',
                        borderColor: '#e2e8f0',
                      }}
                      className="px-6 hover:bg-gray-50 uppercase tracking-wider"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(selectedForm);
                      }}
                    >
                      {t('studentForms.cancel')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#ef4444',
                        borderColor: '#fee2e2',
                        backgroundColor: '#fff',
                      }}
                      className="px-6 hover:bg-red-50 hover:border-red-200 uppercase tracking-wider"
                      onClick={() => handleUpdate('rejected')}
                    >
                      {t('studentForms.reject')}
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      className="px-8 hover:bg-gray-800 text-white gap-2 uppercase tracking-wider"
                      onClick={() => handleUpdate('approved')}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.approve')}
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      className="px-8 hover:bg-blue-700 text-white gap-2 uppercase tracking-wider"
                      onClick={() => handleUpdate()}
                    >
                      <Save className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.save')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#64748b',
                        borderColor: '#e2e8f0',
                      }}
                      className="px-6 hover:bg-gray-50 uppercase tracking-wider"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t('studentForms.cancel')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#3b82f6',
                        borderColor: '#dbeafe',
                      }}
                      className="px-6 hover:bg-blue-50 hover:border-blue-200 uppercase tracking-wider"
                      onClick={() => {
                        setIsEditing(true);
                        setEditData(selectedForm);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.editStudent')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#ef4444',
                        borderColor: '#fee2e2',
                        backgroundColor: '#fff',
                      }}
                      className="px-6 hover:bg-red-50 hover:border-red-200 uppercase tracking-wider"
                      onClick={() => handleReject(selectedForm.id)}
                    >
                      {t('studentForms.reject')}
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        fontSize: '11px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      className="px-8 hover:bg-gray-800 text-white gap-2 uppercase tracking-wider"
                      onClick={() => handleApprove(selectedForm.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      {t('studentForms.approve')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CustomDialog>
    </div >
  );
}
