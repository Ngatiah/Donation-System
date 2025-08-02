import * as Popover from '@radix-ui/react-popover';
import { Sun, Moon, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useThemeStore } from '../store/authStore';

const ThemeSwitcher = ()=> {
  const {theme,setTheme,toggleTheme} = useThemeStore()

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Settings className="h-5 w-5" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="rounded-lg p-4 bg-white dark:bg-gray-900 shadow-lg space-y-2">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Choose Theme</div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-blue-200' : 'bg-gray-100'} hover:bg-blue-300`}
              aria-label="Light theme"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-gray-100'} hover:bg-blue-500`}
              aria-label="Dark theme"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
export default ThemeSwitcher;