import React from 'react';
import type { ActivityLogEntry, PracticeMode } from '../types';
import {
    XCircleIcon, BookOpenIcon, LightBulbIcon, ShieldExclamationIcon, ArrowsRightLeftIcon,
    ChatBubbleLeftRightIcon, QuestionMarkCircleIcon, SquaresPlusIcon, LinkIcon, PuzzlePieceIcon,
    QueueListIcon, PencilIcon, ChartBarIcon
} from './IconComponents';

interface ActivityHistoryViewProps {
  onClose: () => void;
  history: ActivityLogEntry[];
}

const practiceModeLabels: Record<PracticeMode, string> = {
    example: 'ຕົວຢ່າງປະໂຫຍກ',
    correction: 'ຊອກຫາຂໍ້ຜິດພາດ',
    scramble: 'ລຽງປະໂຫຍກ',
    building: 'ສ້າງປະໂຫຍກ',
    writing: 'ຝຶກຂຽນ',
    ordering: '排列顺序',
    translation_choice: 'ເລືອກຄຳແປ',
    build_from_translation: 'ປະກອບຄຳສັບ',
    matching: 'ຈັບຄູ່ຄຳສັບ',
    conjunction: 'ເຊື່ອມປະໂຫຍກ'
};

const IconMap: Record<string, React.FC<{className?: string}>> = {
    lesson_start: BookOpenIcon,
    quiz_complete: ChartBarIcon,
    practice_complete: LightBulbIcon,
    example: LightBulbIcon,
    correction: ShieldExclamationIcon,
    scramble: ArrowsRightLeftIcon,
    building: ChatBubbleLeftRightIcon,
    translation_choice: QuestionMarkCircleIcon,
    build_from_translation: SquaresPlusIcon,
    matching: LinkIcon,
    conjunction: PuzzlePieceIcon,
    ordering: QueueListIcon,
    writing: PencilIcon,
};

const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('lo-LA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Fix: Completed the component implementation to return JSX and added a default export to resolve module loading errors.
const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({ onClose, history }) => {
    const renderLogEntry = (entry: ActivityLogEntry) => {
        let title = '';
        let details = '';
        const Icon = IconMap[entry.mode || entry.type] || BookOpenIcon;

        switch (entry.type) {
            case 'lesson_start':
                title = `ເລີ່ມບົດຮຽນ ${entry.lesson}`;
                details = `HSK ${entry.level}`;
                break;
            case 'quiz_complete':
                title = `ຈົບແບບທົດສອບ: ${practiceModeLabels[entry.mode!] || entry.mode}`;
                details = `HSK ${entry.level}, ບົດ ${entry.lesson} - ຄະແນນ: ${entry.score}/${entry.total}`;
                break;
            case 'practice_complete':
                 title = `ຝຶກ: ${practiceModeLabels[entry.mode!] || entry.mode}`;
                 details = `HSK ${entry.level}, ບົດ ${entry.lesson}`;
                 if (entry.word) {
                     details += ` - ຄຳສັບ: ${entry.word}`;
                 }
                 if (typeof entry.isCorrect === 'boolean') {
                     details += entry.isCorrect ? ' (ຖືກຕ້ອງ)' : ' (ຜິດ)';
                 }
                break;
        }

        return (
            <li key={entry.id} className="flex items-start gap-4 py-3">
                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{details}</p>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{formatTimestamp(entry.id)}</p>
            </li>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in transform transition-all flex flex-col"
                style={{maxHeight: '90vh'}}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ປະຫວັດການຮຽນ</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XCircleIcon className="w-8 h-8"/>
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {history.length > 0 ? (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {history.map(renderLogEntry)}
                        </ul>
                    ) : (
                        <p className="text-center py-16 text-slate-500 dark:text-slate-400">
                            ບໍ່ມີປະຫວັດການຮຽນ.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityHistoryView;
