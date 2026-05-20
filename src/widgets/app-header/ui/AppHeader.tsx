import { Box, Flex, HStack, IconButton, Text, Tooltip, useColorMode } from '@chakra-ui/react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@entities/session';
import { ROUTES } from '@shared/config/routes';
import { LanguageSwitcher } from '@widgets/language-switcher';
import type { ReactNode } from 'react';

interface Props {
  subtitle?: string;
  right?: ReactNode;
  showLogout?: boolean;
}

export const AppHeader = ({ subtitle, right, showLogout = true }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.role);
  const studentName = useSessionStore((s) => s.studentName);
  const email = useSessionStore((s) => s.email);
  const signOut = useSessionStore((s) => s.signOut);
  const { colorMode, toggleColorMode } = useColorMode();

  const onLogout = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  return (
    <Box
      as="header"
      borderBottomWidth="1px"
      borderColor="line"
      bg="paper.50"
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="saturate(140%) blur(6px)"
    >
      <Flex
        maxW="960px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={4}
        align="center"
        justify="space-between"
        gap={4}
      >
        <Box
          as="button"
          onClick={() => navigate(ROUTES.HOME)}
          textAlign="left"
          _hover={{ opacity: 0.8 }}
          transition="opacity 150ms"
        >
          <Text
            fontFamily="heading"
            fontSize="2xl"
            fontWeight={500}
            letterSpacing="-0.02em"
            lineHeight="1"
          >
            Exam Platform
          </Text>
          {subtitle && (
            <Text fontSize="xs" color="ink.500" mt={1} letterSpacing="0.02em">
              {subtitle}
            </Text>
          )}
        </Box>
        <HStack spacing={3}>
          {right}
          <LanguageSwitcher />
          <Tooltip
            label={colorMode === 'light' ? t('header.darkTheme') : t('header.lightTheme')}
            placement="bottom-end"
            hasArrow
          >
            <IconButton
              aria-label={colorMode === 'light' ? t('header.enableDark') : t('header.enableLight')}
              icon={
                colorMode === 'light'
                  ? <Moon size={18} strokeWidth={1.5} />
                  : <Sun size={18} strokeWidth={1.5} />
              }
              variant="ghost"
              onClick={toggleColorMode}
            />
          </Tooltip>
          {showLogout && role && (
            <>
              {role === 'student' && studentName && (
                <Text
                  display={{ base: 'none', md: 'block' }}
                  color="ink.700"
                  fontSize="sm"
                  fontFamily="mono"
                >
                  {studentName}
                </Text>
              )}
              {role === 'teacher' && email && (
                <Text
                  display={{ base: 'none', md: 'block' }}
                  color="ink.700"
                  fontSize="sm"
                  fontFamily="mono"
                >
                  {email}
                </Text>
              )}
              <Tooltip label={t('header.logout')} placement="bottom-end" hasArrow>
                <IconButton
                  aria-label={t('header.logout')}
                  icon={<LogOut size={18} strokeWidth={1.5} />}
                  variant="ghost"
                  onClick={onLogout}
                />
              </Tooltip>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};
