// import { LucideIcon } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, color = 'blue' }) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-600',
        green: 'bg-green-500/10 text-green-600',
        purple: 'bg-purple-500/10 text-purple-600',
        orange: 'bg-orange-500/10 text-orange-600',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${colorClasses[color] || colorClasses.blue}`}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}
