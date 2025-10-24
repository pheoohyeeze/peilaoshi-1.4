import React from 'react';
import { XCircleIcon } from './IconComponents';

const VipTutorial: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    
  const steps = [
    {
      step: 1,
      title: 'ກົດປຸ່ມ "ກົດສັ່ງຊື້"',
      description: 'ຈາກໜ້າ VIP, ກົດປຸ່ມສັ່ງຊື້ສີເຫຼືອງເພື່ອເລີ່ມຕົ້ນຂັ້ນຕອນ.',
    },
    {
      step: 2,
      title: 'ສະແກນ QR Code',
      description: 'ໃຊ້ແອັບ WeChat ຫຼື WhatsApp ຂອງທ່ານສະແກນ QR Code ເພື່ອຕິດຕໍ່ຫາເຫຼົ່າຊືໂດຍກົງ.',
    },
    {
      step: 3,
      title: 'ແຈ້ງຊື່ຜູ້ໃຊ້ (Username)',
      description: 'ສົ່ງຊື່ຜູ້ໃຊ້ໃນແອັບຂອງທ່ານໃຫ້ເຫຼົ່າຊືເພື່ອກວດສອບ ແລະ ຢືນຢັນການສັ່ງຊື້.',
    },
    {
      step: 4,
      title: 'ຊຳລະເງິນ',
      description: 'ເຫຼົ່າຊືຈະສົ່ງລາຍລະອຽດການຊຳລະເງິນໃຫ້. ທ່ານສາມາດຊຳລະຜ່ານ BCEL One ຫຼື ຕາມທີ່ໄດ້ຕົກລົງກັນ.',
    },
    {
      step: 5,
      title: 'ລໍຖ້າການເປີດໃຊ້',
      description: 'ຫຼັງຈາກຊຳລະເງິນສຳເລັດ, ເຫຼົ່າຊືຈະເປີດໃຊ້ VIP ໃຫ້ທ່ານ. ຈາກນັ້ນກໍສາມາດເຂົ້າເຖິງທຸກฟีเจอร์ໄດ້ເລີຍ!',
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ວິທີການສັ່ງຊື້ ແລະ ເປີດໃຊ້ VIP</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
            <XCircleIcon className="w-8 h-8"/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <div className="text-center mb-6">
                <p className="text-lg text-slate-600 dark:text-slate-300">ສະບາຍດີ! ຢາກຍົກລະດັບການຮຽນ HSK ໃຫ້ກ້າວໄປອີກຂັ້ນບໍ່? VIP Member ຄືຄຳຕອບ!</p>
                <p className="mt-2 font-semibold text-brand-primary">ປົດລັອກທ່າແຮງການຮຽນຮູ້ຂອງທ່ານດ້ວຍຂັ້ນຕອນງ່າຍໆພຽງ 5 ຂັ້ນຕອນ:</p>
            </div>

            <div className="space-y-4">
                {steps.map(({ step, title, description }) => (
                    <div key={step} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-xl">
                            {step}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{description}</p>
                        </div>
                    </div>
                ))}
            </div>

             <div className="mt-8 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg">
                <h4 className="font-bold text-blue-800 dark:text-blue-300">ສິດທິປະໂຫຍດ VIP:</h4>
                <ul className="list-disc list-inside mt-2 text-blue-700 dark:text-blue-300 space-y-1">
                    <li>ປົດລັອກແບບຝຶກຫັດຂັ້ນສູງທັງໝົດ (HSK 4-6).</li>
                    <li>ເຂົ້າເຖິງຟີເຈີພິເສດ ເຊັ່ນ: ການສະແກນວັດຖຸ.</li>
                    <li>ຮັບຟຣີ! ໄຟລ໌ປື້ມແບບຮຽນ HSK ຄົບຊຸດ 1 ລະດັບ.</li>
                </ul>
            </div>

             <div className="mt-6 text-center">
                 <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">ມາເລີ່ມຕົ້ນເສັ້ນທາງການຮຽນຮູ້ທີ່ບໍ່ມີຂີດຈຳກັດນຳກັນເລີຍ!</p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default VipTutorial;
