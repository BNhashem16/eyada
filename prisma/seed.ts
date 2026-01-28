import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eyada.com' },
    update: {},
    create: {
      email: 'admin@eyada.com',
      phoneNumber: '01000000000',
      passwordHash: adminPassword,
      fullName: 'System Admin',
      role: Role.ADMIN,
      isApproved: true,
    },
  });
  console.log('Admin user created:', admin.email);

  // Egyptian Governorates (States)
  const states = [
    { nameAr: 'القاهرة', nameEn: 'Cairo', code: 'CAI' },
    { nameAr: 'الجيزة', nameEn: 'Giza', code: 'GIZ' },
    { nameAr: 'الإسكندرية', nameEn: 'Alexandria', code: 'ALX' },
    { nameAr: 'الدقهلية', nameEn: 'Dakahlia', code: 'DKH' },
    { nameAr: 'البحر الأحمر', nameEn: 'Red Sea', code: 'RDS' },
    { nameAr: 'البحيرة', nameEn: 'Beheira', code: 'BHR' },
    { nameAr: 'الفيوم', nameEn: 'Fayoum', code: 'FYM' },
    { nameAr: 'الغربية', nameEn: 'Gharbia', code: 'GHR' },
    { nameAr: 'الإسماعيلية', nameEn: 'Ismailia', code: 'ISM' },
    { nameAr: 'المنوفية', nameEn: 'Monufia', code: 'MNF' },
    { nameAr: 'المنيا', nameEn: 'Minya', code: 'MNY' },
    { nameAr: 'القليوبية', nameEn: 'Qalyubia', code: 'QLY' },
    { nameAr: 'الوادي الجديد', nameEn: 'New Valley', code: 'NVL' },
    { nameAr: 'السويس', nameEn: 'Suez', code: 'SUZ' },
    { nameAr: 'الشرقية', nameEn: 'Sharqia', code: 'SHQ' },
    { nameAr: 'جنوب سيناء', nameEn: 'South Sinai', code: 'SSN' },
    { nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', code: 'KFS' },
    { nameAr: 'مطروح', nameEn: 'Matrouh', code: 'MTR' },
    { nameAr: 'الأقصر', nameEn: 'Luxor', code: 'LXR' },
    { nameAr: 'قنا', nameEn: 'Qena', code: 'QNA' },
    { nameAr: 'شمال سيناء', nameEn: 'North Sinai', code: 'NSN' },
    { nameAr: 'سوهاج', nameEn: 'Sohag', code: 'SHG' },
    { nameAr: 'أسوان', nameEn: 'Aswan', code: 'ASN' },
    { nameAr: 'أسيوط', nameEn: 'Asyut', code: 'AST' },
    { nameAr: 'بني سويف', nameEn: 'Beni Suef', code: 'BNS' },
    { nameAr: 'بورسعيد', nameEn: 'Port Said', code: 'PSD' },
    { nameAr: 'دمياط', nameEn: 'Damietta', code: 'DMT' },
  ];

  const createdStates: { [key: string]: string } = {};

  for (const state of states) {
    const created = await prisma.state.upsert({
      where: { code: state.code },
      update: {},
      create: {
        name: { ar: state.nameAr, en: state.nameEn },
        code: state.code,
        isActive: true,
      },
    });
    createdStates[state.nameEn] = created.id;
  }
  console.log('States created:', Object.keys(createdStates).length);

  // Major Cities for each Governorate
  const cities: { state: string; nameAr: string; nameEn: string }[] = [
    // Cairo
    { state: 'Cairo', nameAr: 'مدينة نصر', nameEn: 'Nasr City' },
    { state: 'Cairo', nameAr: 'المعادي', nameEn: 'Maadi' },
    { state: 'Cairo', nameAr: 'مصر الجديدة', nameEn: 'Heliopolis' },
    { state: 'Cairo', nameAr: 'الزمالك', nameEn: 'Zamalek' },
    { state: 'Cairo', nameAr: 'المقطم', nameEn: 'Mokattam' },
    { state: 'Cairo', nameAr: 'التجمع الخامس', nameEn: 'Fifth Settlement' },
    { state: 'Cairo', nameAr: 'القاهرة الجديدة', nameEn: 'New Cairo' },
    { state: 'Cairo', nameAr: 'شبرا', nameEn: 'Shubra' },
    { state: 'Cairo', nameAr: 'وسط البلد', nameEn: 'Downtown' },

    // Giza
    { state: 'Giza', nameAr: 'الدقي', nameEn: 'Dokki' },
    { state: 'Giza', nameAr: 'المهندسين', nameEn: 'Mohandessin' },
    { state: 'Giza', nameAr: 'الهرم', nameEn: 'Haram' },
    { state: 'Giza', nameAr: 'فيصل', nameEn: 'Faisal' },
    { state: 'Giza', nameAr: '6 أكتوبر', nameEn: '6th of October' },
    { state: 'Giza', nameAr: 'الشيخ زايد', nameEn: 'Sheikh Zayed' },

    // Alexandria
    { state: 'Alexandria', nameAr: 'سموحة', nameEn: 'Smouha' },
    { state: 'Alexandria', nameAr: 'سيدي جابر', nameEn: 'Sidi Gaber' },
    { state: 'Alexandria', nameAr: 'العجمي', nameEn: 'Agami' },
    { state: 'Alexandria', nameAr: 'المنتزه', nameEn: 'Montaza' },
    { state: 'Alexandria', nameAr: 'ستانلي', nameEn: 'Stanley' },

    // Dakahlia
    { state: 'Dakahlia', nameAr: 'المنصورة', nameEn: 'Mansoura' },
    { state: 'Dakahlia', nameAr: 'طلخا', nameEn: 'Talkha' },
    { state: 'Dakahlia', nameAr: 'ميت غمر', nameEn: 'Mit Ghamr' },

    // Sharqia
    { state: 'Sharqia', nameAr: 'الزقازيق', nameEn: 'Zagazig' },
    { state: 'Sharqia', nameAr: 'العاشر من رمضان', nameEn: '10th of Ramadan' },
    { state: 'Sharqia', nameAr: 'بلبيس', nameEn: 'Bilbeis' },

    // Gharbia
    { state: 'Gharbia', nameAr: 'طنطا', nameEn: 'Tanta' },
    { state: 'Gharbia', nameAr: 'المحلة الكبرى', nameEn: 'El Mahalla El Kubra' },

    // Qalyubia
    { state: 'Qalyubia', nameAr: 'بنها', nameEn: 'Benha' },
    { state: 'Qalyubia', nameAr: 'شبرا الخيمة', nameEn: 'Shubra El Kheima' },
    { state: 'Qalyubia', nameAr: 'العبور', nameEn: 'Obour' },

    // Port Said
    { state: 'Port Said', nameAr: 'بورسعيد', nameEn: 'Port Said City' },

    // Suez
    { state: 'Suez', nameAr: 'السويس', nameEn: 'Suez City' },

    // Ismailia
    { state: 'Ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia City' },

    // Luxor
    { state: 'Luxor', nameAr: 'الأقصر', nameEn: 'Luxor City' },

    // Aswan
    { state: 'Aswan', nameAr: 'أسوان', nameEn: 'Aswan City' },

    // Asyut
    { state: 'Asyut', nameAr: 'أسيوط', nameEn: 'Asyut City' },

    // Minya
    { state: 'Minya', nameAr: 'المنيا', nameEn: 'Minya City' },

    // Sohag
    { state: 'Sohag', nameAr: 'سوهاج', nameEn: 'Sohag City' },

    // Qena
    { state: 'Qena', nameAr: 'قنا', nameEn: 'Qena City' },

    // Fayoum
    { state: 'Fayoum', nameAr: 'الفيوم', nameEn: 'Fayoum City' },

    // Beni Suef
    { state: 'Beni Suef', nameAr: 'بني سويف', nameEn: 'Beni Suef City' },

    // Red Sea
    { state: 'Red Sea', nameAr: 'الغردقة', nameEn: 'Hurghada' },
    { state: 'Red Sea', nameAr: 'سفاجا', nameEn: 'Safaga' },

    // South Sinai
    { state: 'South Sinai', nameAr: 'شرم الشيخ', nameEn: 'Sharm El Sheikh' },
    { state: 'South Sinai', nameAr: 'دهب', nameEn: 'Dahab' },

    // Matrouh
    { state: 'Matrouh', nameAr: 'مرسى مطروح', nameEn: 'Marsa Matrouh' },

    // Beheira
    { state: 'Beheira', nameAr: 'دمنهور', nameEn: 'Damanhur' },

    // Kafr El Sheikh
    { state: 'Kafr El Sheikh', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh City' },

    // Monufia
    { state: 'Monufia', nameAr: 'شبين الكوم', nameEn: 'Shibin El Kom' },

    // Damietta
    { state: 'Damietta', nameAr: 'دمياط', nameEn: 'Damietta City' },

    // New Valley
    { state: 'New Valley', nameAr: 'الخارجة', nameEn: 'Kharga' },

    // North Sinai
    { state: 'North Sinai', nameAr: 'العريش', nameEn: 'Arish' },
  ];

  let citiesCount = 0;
  for (const city of cities) {
    const stateId = createdStates[city.state];
    if (stateId) {
      await prisma.city.create({
        data: {
          name: { ar: city.nameAr, en: city.nameEn },
          stateId,
          isActive: true,
        },
      });
      citiesCount++;
    }
  }
  console.log('Cities created:', citiesCount);

  // Medical Specialties
  const specialties = [
    { nameAr: 'طب عام', nameEn: 'General Medicine' },
    { nameAr: 'طب الأطفال', nameEn: 'Pediatrics' },
    { nameAr: 'أمراض النساء والتوليد', nameEn: 'Obstetrics & Gynecology' },
    { nameAr: 'جراحة عامة', nameEn: 'General Surgery' },
    { nameAr: 'جراحة العظام', nameEn: 'Orthopedic Surgery' },
    { nameAr: 'أمراض القلب', nameEn: 'Cardiology' },
    { nameAr: 'الأمراض الجلدية', nameEn: 'Dermatology' },
    { nameAr: 'طب العيون', nameEn: 'Ophthalmology' },
    { nameAr: 'الأنف والأذن والحنجرة', nameEn: 'ENT (Otolaryngology)' },
    { nameAr: 'الأمراض الباطنية', nameEn: 'Internal Medicine' },
    { nameAr: 'طب الأسنان', nameEn: 'Dentistry' },
    { nameAr: 'الأمراض العصبية', nameEn: 'Neurology' },
    { nameAr: 'جراحة المخ والأعصاب', nameEn: 'Neurosurgery' },
    { nameAr: 'الطب النفسي', nameEn: 'Psychiatry' },
    { nameAr: 'المسالك البولية', nameEn: 'Urology' },
    { nameAr: 'أمراض الكلى', nameEn: 'Nephrology' },
    { nameAr: 'أمراض الجهاز الهضمي', nameEn: 'Gastroenterology' },
    { nameAr: 'الغدد الصماء والسكر', nameEn: 'Endocrinology & Diabetes' },
    { nameAr: 'أمراض الدم', nameEn: 'Hematology' },
    { nameAr: 'الأورام', nameEn: 'Oncology' },
    { nameAr: 'أمراض الصدر', nameEn: 'Pulmonology' },
    { nameAr: 'أمراض الروماتيزم', nameEn: 'Rheumatology' },
    { nameAr: 'جراحة التجميل', nameEn: 'Plastic Surgery' },
    { nameAr: 'العلاج الطبيعي', nameEn: 'Physical Therapy' },
    { nameAr: 'التغذية العلاجية', nameEn: 'Clinical Nutrition' },
    { nameAr: 'الأشعة التشخيصية', nameEn: 'Radiology' },
    { nameAr: 'طب الطوارئ', nameEn: 'Emergency Medicine' },
    { nameAr: 'طب الأسرة', nameEn: 'Family Medicine' },
  ];

  for (const specialty of specialties) {
    await prisma.specialty.create({
      data: {
        name: { ar: specialty.nameAr, en: specialty.nameEn },
        isActive: true,
      },
    });
  }
  console.log('Specialties created:', specialties.length);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
