<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/17o2b7rKamuN3avceDZsUYorkDL9YTvLC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


1. ໂຄງສ້າງຫຼັກຂອງ Frontend (Core Frontend Architecture)
Framework: ແອັບພລິເຄຊັນຖືກສ້າງຂຶ້ນດ້ວຍ React ແລະ TypeScript. ການເລືອກນີ້ຊ່ວຍໃຫ້ມີການພັດທະນາແບບ Component-Based ທີ່ເຂັ້ມແຂງ, ສາມາດກວດສອບປະເພດຂໍ້ມູນ (Type-Safe) ເພື່ອຫຼຸດຜ່ອນຂໍ້ຜິດພາດ, ແລະ ງ່າຍຕໍ່ການຈັດການສະຖານະຂອງ UI ທີ່ຊັບຊ້ອນ.

ການຈັດການ Dependencies: ພວກເຮົາໃຊ້ importmap ທີ່ທັນສະໄໝໃນ index.html ເພື່ອຈັດການ Dependencies ຫຼັກເຊັ່ນ React ແລະ Gemini API (@google/genai) ໂດຍກົງໃນ Browser. ວິທີນີ້ຊ່ວຍຫຼຸດຜ່ອນຄວາມຊັບຊ້ອນຂອງຂັ້ນຕອນການ Build, ເຮັດໃຫ້ແອັບໂຫຼດໄດ້ໄວຂຶ້ນ.

ການຈັດຮູບແບບ (Styling): Tailwind CSS ຖືກນຳໃຊ້ຜ່ານ CDN ເພື່ອການພັດທະນາ UI ທີ່ວ່ອງໄວແບບ Utility-First. ແອັບຮອງຮັບ Dark Mode ຢ່າງເຕັມຮູບແບບ, ເຊິ່ງຖືກຄວບຄຸມຜ່ານ localStorage ແລະ CSS classes.

ການຈັດການສະຖານະ (State Management): ສະຖານະຂອງແອັບທັງໝົດຖືກຈັດການຢູ່ໃນ Component ຫຼັກ (App.tsx) ໂດຍໃຊ້ React Hooks (useState, useCallback, useMemo, useEffect). ນີ້ແມ່ນຮູບແບບທີ່ມີປະສິດທິພາບສຳລັບແອັບຂະໜາດນີ້, ເຮັດໃຫ້ການໄຫຼຂອງຂໍ້ມູນເຂົ້າໃຈງ່າຍ.

2. ໂມດູນການທຳງານ (Functional Modules)
ແອັບພລິເຄຊັນຖືກແບ່ງອອກເປັນໂມດູນຕ່າງໆຕາມໜ້າທີ່ການທຳງານດັ່ງນີ້:

A. ໂມດູນການກວດສອບສິດ ແລະ ຈັດການຜູ້ໃຊ້ (Authentication & User Management)

ໜ້າທີ່: ຈັດການການລົງທະບຽນ, ເຂົ້າສູ່ລະບົບ, ແລະ ການຈັດການ Session ຂອງຜູ້ໃຊ້. ມັນສາມາດແຍກລະຫວ່າງຜູ້ໃຊ້ທົ່ວໄປ ແລະ ຜູ້ດູແລລະບົບ (Admin).

ການຈັດການອຸປະກອນ: ມີລະບົບຈຳກັດການເຂົ້າສູ່ລະບົບໄດ້ພຽງ 2 ອຸປະກອນຕໍ່ໜຶ່ງບັນຊີ ເພື່ອປ້ອງກັນການແບ່ງປັນບັນຊີ. ຜູ້ໃຊ້ສາມາດຈັດການອຸປະກອນຂອງຕົນເອງໄດ້ຜ່ານໜ້າໂປຣໄຟລ໌.

ໜ້າທີ່ຜູ້ດູແລລະບົບ: ມີ Dashboard ສະເພາະສຳລັບ Admin ເພື່ອເບິ່ງພາບລວມ, ຈັດການຂໍ້ມູນຜູ້ໃຊ້ (ເພີ່ມ, ລຶບ, ແກ້ໄຂ, ອັບເກຣດ VIP), ແລະ ຕິດຕາມກິດຈະກຳຂອງຜູ້ໃຊ້ທັງໝົດ.

Component ທີ່ກ່ຽວຂ້ອງ: Auth.tsx, AdminDashboard.tsx, ProfilePage.tsx, adminService.ts.

B. ໂມດູນຫຼັກສູດ ແລະ ການຮຽນຮູ້ (Curriculum & Learning Core)

ແຫຼ່ງຂໍ້ມູນ: ຄຳສັບ HSK1-6 ທັງໝົດຖືກເກັບໄວ້ໃນ Local ເປັນไฟล์ TypeScript (/data/*.ts), ເຮັດໃຫ້ສາມາດເຂົ້າເຖິງຄຳສັບພື້ນຖານໄດ້ແມ້ບໍ່ມີອິນເຕີເນັດ.

ຂັ້ນຕອນການຮຽນ: ຜູ້ໃຊ້ເລືອກລະດັບ HSK -> ເລືອກບົດຮຽນ -> ຮຽນຜ່ານບັດຄຳສັບ (Flashcard).

ບັດຄຳສັບ (Flashcard.tsx): ເປັນເຄື່ອງມືການຮຽນຮູ້ຫຼັກ. ມັນມີການໂຕ້ຕອບສູງ, ສາມາດພິກເພື່ອເບິ່ງຄຳແປ, ເປີດ/ປິດ Pinyin, ແລະ ຟັງສຽງອອກສຽງໄດ້.

Component ທີ່ກ່ຽວຂ້ອງ: HSKLevelSelector.tsx, LessonSelector.tsx, Flashcard.tsx, data/.

C. ໂມດູນການຝຶກຫັດດ້ວຍ AI (AI-Powered Practice)

ແກນຫຼັກ AI (geminiService.ts): ໂມດູນນີ້ເປັນຫົວໃຈຂອງແອັບ, ຮັບຜິດຊອບການສື່ສານທັງໝົດກັບ Gemini API.

ການສ້າງແບບຝຶກຫັດແບບ Dynamic: ໃຊ້ Gemini API (gemini-2.5-flash) ພ້ອມກັບ responseSchema ເພື່ອສ້າງແບບຝຶກຫັດທີ່ຫຼາກຫຼາຍ (ເຊັ່ນ: ຕົວຢ່າງປະໂຫຍກ, ຊອກຫາຂໍ້ຜິດພາດ, ລຽງປະໂຫຍກ) ຕາມຄວາມຕ້ອງການ. ນີ້ເຮັດໃຫ້ມີແບບຝຶກຫັດໃໝ່ໆບໍ່ຈຳກັດ.

ການໃຫ້ຄຳຕິຊົມແບບໂຕ້ຕອບ: ຜູ້ໃຊ້ສາມາດຂຽນປະໂຫຍກ ຫຼື ບົດຂຽນສັ້ນໆ ແລະ ສົ່ງໃຫ້ AI ກວດສອບ. Gemini ຈະວິເຄາະໄວຍະກອນ, ຄວາມເໝາະສົມ, ແລະ ໃຫ້ຄຳຄິດເຫັນເປັນພາສາລາວ.

Component ທີ່ກ່ຽວຂ້ອງ: PracticeView.tsx, geminiService.ts.

D. ໂມດູນການຮັບຮູ້ພາບ (Visual Recognition)

ໜ້າທີ່: ໃຊ້ກ້ອງຂອງອຸປະກອນເພື່ອຖ່າຍຮູບຕົວອັກສອນຈີນ ຫຼື ວັດຖຸຕ່າງໆ.

AI Vision: ສົ່ງຮູບພາບທີ່ຖ່າຍໄດ້ໄປໃຫ້ Gemini API (gemini-2.5-flash) ວິເຄາະ.

ສອງໂໝດການທຳງານ:

ສະແກນຕົວອັກສອນ: ກວດຫາຕົວອັກສອນຈີນໃນຮູບ ແລະ ສະແດງ Pinyin, ຄຳແປ, ແລະ ລະດັບ HSK.

ສະແກນວັດຖຸ (VIP): ກວດຫາວັດຖຸຫຼັກໃນຮູບ ແລະ ບອກຊື່ເປັນພາສາຈີນ, Pinyin, ແລະ ຄຳແປ.

Component ທີ່ກ່ຽວຂ້ອງ: CameraView (ພາຍໃນ App.tsx), geminiService.ts.

E. ໂມດູນການຕິດຕາມຄວາມຄືບໜ້າ ແລະ ກິດຈະກຳ (Progress & Activity Tracking)

ການເກັບຂໍ້ມູນ: ຄວາມຄືບໜ້າໃນການຮຽນ (ຄະແນນຄວາມຊຳນານຂອງຄຳສັບ) ແລະ ປະຫວັດກິດຈະກຳຕ່າງໆ ຈະຖືກເກັບໄວ້ໃນ localStorage ໂດຍແຍກຕາມຊື່ຜູ້ໃຊ້.

ລະບົບຄວາມຊຳນານ: ໃຊ້ລະບົບຄະແນນງ່າຍໆ ເພື່ອຕິດຕາມວ່າຜູ້ໃຊ້ຈື່ຄຳສັບໃດໄດ້ດີແລ້ວ. ຄະແນນຈະເພີ່ມຂຶ້ນເມື່ອຕອບຖືກ ແລະ ຫຼຸດລົງເມື່ອຕອບຜິດ.

ການສະແດງຜົນ: ມີໜ້າຕ່າງສະແດງສະຖິຕິຄວາມຄືບໜ້າ (ProgressView.tsx) ແລະ ລາຍການກິດຈະກຳທີ່ຜ່ານມາ (ActivityHistoryView.tsx).

Component ທີ່ກ່ຽວຂ້ອງ: progressService.ts, activityLogService.ts, ProgressView.tsx, ActivityHistoryView.tsx.

F. ໂມດູນ VIP ແລະ ການສ້າງລາຍໄດ້ (VIP & Monetization)

ໜ້າທີ່: ຈຳກັດການເຂົ້າເຖິງບາງໜ້າທີ່ (ເຊັ່ນ: ແບບຝຶກຫັດຂັ້ນສູງ, ບົດຮຽນລະດັບສູງ, ການສະແກນວັດຖຸ) ສະເພາະສະມາຊິກ VIP.

ຂັ້ນຕອນການເປັນສະມາຊິກ: ແອັບມີໜ້າ VIP ທີ່ສະແດງຂໍ້ສະເໜີຕ່າງໆ. ເມື່ອກົດ "ສັ່ງຊື້", ແອັບຈະສະແດງ QR Code ສຳລັບ WeChat ແລະ WhatsApp ເພື່ອໃຫ້ຜູ້ໃຊ້ຕິດຕໍ່ກັບ Admin ສຳລັບການຊຳລະເງິນ ແລະ ການເປີດໃຊ້ງານ VIP, ເຊິ່ງ Admin ຈະເປັນຜູ້ອັບເດດຂໍ້ມູນໃນລະບົບດ້ວຍຕົນເອງ.

Component ທີ່ກ່ຽວຂ້ອງ: VIPPage.tsx, QRCodePage.tsx.
