import type { ThemeConfig } from 'antd';

export const palette = {
  navy: '#153B60', primary: '#1677FF', cyan: '#0891B2', success: '#16A34A',
  warning: '#D97706', danger: '#DC2626', background: '#F3F7FB',
  text: '#0F172A', secondary: '#475569', caption: '#52657A', border: '#DCE5EF',
} as const;

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: palette.primary, colorInfo: palette.primary,
    colorSuccess: palette.success, colorWarning: palette.warning, colorError: palette.danger,
    colorText: palette.text, colorTextSecondary: palette.secondary,
    colorTextTertiary: palette.caption, colorTextQuaternary: palette.caption,
    colorTextPlaceholder: palette.caption, colorBorder: palette.border,
    colorBgLayout: palette.background, colorBgContainer: '#FFFFFF',
    colorLink: '#075FCC', colorLinkHover: '#0047AD', colorLinkActive: '#003C91',
    fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif", fontSize: 14,
    fontSizeSM: 12, fontSizeLG: 16, fontSizeHeading1: 26, fontSizeHeading2: 18,
    fontWeightStrong: 700, lineHeight: 1.65, controlHeight: 42,
    controlHeightLG: 48, controlHeightSM: 34, borderRadius: 10,
    borderRadiusLG: 14, motionDurationMid: '0.18s', motionDurationSlow: '0.2s',
    boxShadowSecondary: '0 10px 32px rgba(21, 59, 96, 0.10)',
  },
  components: {
    Table: { headerBg: '#EDF3FA', headerColor: '#334B66', headerSplitColor: 'transparent',
      headerBorderRadius: 10, rowHoverBg: '#F0F7FF', cellPaddingBlock: 14, cellPaddingInline: 16,
      fontSize: 14, borderColor: '#E7EDF5' },
    Button: { fontWeight: 600, colorPrimary: '#0966E4', colorPrimaryHover: '#075BCC', colorPrimaryActive: '#064FB3', primaryShadow: '0 4px 10px rgba(22, 119, 255, 0.18)' },
    Tabs: { titleFontSize: 14, itemColor: '#475569', itemSelectedColor: '#075FCC', inkBarColor: palette.primary },
    Input: { activeShadow: '0 0 0 3px rgba(22,119,255,0.12)' },
    Select: { optionSelectedBg: '#EAF3FF', optionSelectedColor: '#075FCC' },
    Modal: { titleFontSize: 20, titleColor: palette.navy },
    Form: { labelColor: palette.text, labelFontSize: 14, verticalLabelPadding: '0 0 8px' },
    Alert: { withDescriptionIconSize: 20 },
  },
};
