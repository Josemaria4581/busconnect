import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                title="Claro"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                title="Oscuro"
            >
                <Moon className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                title="Sistema"
            >
                <Monitor className="w-4 h-4" />
            </button>
        </div>
    );
}
