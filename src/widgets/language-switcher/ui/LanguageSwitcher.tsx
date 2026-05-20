import { Menu, MenuButton, MenuItem, MenuList, Button } from '@chakra-ui/react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setLanguage, SUPPORTED_LANGUAGES, type Language } from '@shared/i18n';

const LABELS: Record<Language, string> = {
  ru: 'Русский',
  uz: 'O‘zbekcha',
  kaa: 'Qaraqalpaqsha',
};

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = (i18n.language as Language) in LABELS ? (i18n.language as Language) : 'ru';

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        leftIcon={<Globe size={16} strokeWidth={1.5} />}
        rightIcon={<ChevronDown size={14} strokeWidth={1.5} />}
        fontFamily="mono"
        fontSize="xs"
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        {current}
      </MenuButton>
      <MenuList minW="160px">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            fontWeight={lang === current ? 600 : 400}
          >
            {LABELS[lang]}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
