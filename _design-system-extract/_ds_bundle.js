/* @ds-bundle: {"format":4,"namespace":"EZMatchDesignSystem_ab9a05","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"CardBody","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"EmptyState","sourcePath":"components/core/EmptyState.jsx"},{"name":"Notice","sourcePath":"components/core/Notice.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"EventFeed","sourcePath":"components/match/EventFeed.jsx"},{"name":"STATE_LABEL","sourcePath":"components/match/MatchTable.jsx"},{"name":"STATE_TONE","sourcePath":"components/match/MatchTable.jsx"},{"name":"MatchTable","sourcePath":"components/match/MatchTable.jsx"},{"name":"Scoreboard","sourcePath":"components/match/Scoreboard.jsx"},{"name":"StatTile","sourcePath":"components/match/StatTile.jsx"},{"name":"TaskProgress","sourcePath":"components/match/TaskProgress.jsx"},{"name":"LanguageToggle","sourcePath":"components/navigation/LanguageToggle.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"TopNav","sourcePath":"components/navigation/TopNav.jsx"},{"name":"NavLink","sourcePath":"components/navigation/TopNav.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"477f1a9244e8","components/core/Badge.jsx":"ac3bdfbbf8eb","components/core/Button.jsx":"d38d9373f695","components/core/Card.jsx":"bdc03d77a9f6","components/core/Chip.jsx":"b70c257d135b","components/core/EmptyState.jsx":"4a396917b011","components/core/Notice.jsx":"00f572513197","components/forms/Checkbox.jsx":"798e537fb9ef","components/forms/Field.jsx":"d9956bd31d66","components/forms/Input.jsx":"e3bbcee38ad9","components/forms/Select.jsx":"8eab036b53ca","components/match/EventFeed.jsx":"c20dfb54cad8","components/match/MatchTable.jsx":"47bc9a354195","components/match/Scoreboard.jsx":"a78c08823ab5","components/match/StatTile.jsx":"dc0afe236b45","components/match/TaskProgress.jsx":"430d91be1ad0","components/navigation/LanguageToggle.jsx":"928890ace600","components/navigation/Sidebar.jsx":"ec5f79fd7342","components/navigation/TopNav.jsx":"8702964072e1","ui_kits/panel/AdminHomeScreen.jsx":"5b27759fff47","ui_kits/panel/AdminShell.jsx":"82fa8b7282ca","ui_kits/panel/AppShell.jsx":"3c96edb6961d","ui_kits/panel/ControlRoomScreen.jsx":"812d35f47599","ui_kits/panel/CreateMatchScreen.jsx":"d44a965175ce","ui_kits/panel/LoginScreen.jsx":"41090f34adac","ui_kits/panel/MatchScreen.jsx":"0566bb3ed075","ui_kits/panel/MatchesScreen.jsx":"d75069467aba","ui_kits/panel/SeasonsScreen.jsx":"53db7533aee1","ui_kits/panel/ServersScreen.jsx":"ed53c86c7f44","ui_kits/panel/SettingsScreen.jsx":"4caf0dbac70d","ui_kits/panel/StatsScreen.jsx":"6b6b70e3c7aa","ui_kits/panel/TeamsScreen.jsx":"89320c180109","ui_kits/panel/UsersScreen.jsx":"25383ebff8f5","ui_kits/panel/data.js":"8c4295a10135"},"inlinedExternals":[],"unexposedExports":[{"name":"formatScore","sourcePath":"components/match/MatchTable.jsx"}]} */

(() => {

const __ds_ns = (window.EZMatchDesignSystem_ab9a05 = window.EZMatchDesignSystem_ab9a05 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
const MARKS = {
  shard: '../../assets/logo-shard.svg',
  bracket: '../../assets/logo-bracket.svg',
  reticle: '../../assets/logo-reticle.svg',
  caret: '../../assets/logo-caret.svg'
};
const SIZES = {
  sm: [22, 'var(--text-sm)'],
  md: [28, 'var(--text-md)'],
  lg: [40, 'var(--text-2xl)']
};
function Logo({
  mark = 'reticle',
  size = 'md',
  subtitle,
  href = '/',
  src,
  style
}) {
  const [px, font] = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      textDecoration: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src || MARKS[mark] || MARKS.shard,
    alt: "",
    width: px,
    height: px,
    style: {
      display: 'block',
      borderRadius: 'var(--radius-md)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0,
      lineHeight: 1.15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: font,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--text-strong)'
    }
  }, "eZ-Match"), subtitle ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 2,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xs)',
      fontWeight: 'var(--weight-semibold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-eyebrow)',
      color: 'var(--text-faint)'
    }
  }, subtitle) : null));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  ok: ['rgba(61,220,151,.35)', 'rgba(61,220,151,.10)', 'var(--ok-500)'],
  warn: ['rgba(242,181,60,.35)', 'rgba(242,181,60,.10)', 'var(--warn-500)'],
  danger: ['rgba(255,90,95,.35)', 'rgba(255,90,95,.10)', 'var(--danger-500)'],
  info: ['rgba(74,168,255,.35)', 'rgba(74,168,255,.10)', 'var(--info-500)'],
  brand: ['var(--brand-hair)', 'var(--brand-wash)', 'var(--brand-500)'],
  neutral: ['var(--border-2)', 'var(--surface-3)', 'var(--text-muted)']
};
function Badge({
  tone = 'neutral',
  live = false,
  style,
  children
}) {
  const [border, bg, fg] = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      borderRadius: 'var(--radius-sm)',
      border: 'var(--border-w) solid ' + border,
      background: bg,
      color: fg,
      padding: '2px var(--space-4)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-medium)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, live ? /*#__PURE__*/React.createElement("span", {
    className: "ezmatch-live-dot",
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'currentColor'
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-4)',
  height: 'var(--control-h)',
  padding: '0 var(--space-8)',
  borderRadius: 'var(--radius-md)',
  font: 'var(--type-body)',
  fontWeight: 'var(--weight-medium)',
  fontSize: 'var(--text-base)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'var(--transition-color)',
  border: 'var(--border-w) solid transparent',
  textDecoration: 'none'
};
const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-on-brand)',
    fontWeight: 'var(--weight-semibold)',
    borderRadius: 'var(--radius-sm)',
    clipPath: 'var(--clip-notch)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-display)'
  },
  secondary: {
    background: 'var(--surface-2)',
    color: 'var(--text-body)',
    borderColor: 'var(--border-2)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-faint)'
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger-500)',
    borderColor: 'rgba(255,90,95,.5)'
  }
};
const HOVER = {
  primary: {
    background: 'var(--accent-hover)'
  },
  secondary: {
    background: 'var(--surface-3)',
    borderColor: 'var(--border-strong)',
    color: 'var(--text-strong)'
  },
  ghost: {
    background: 'var(--surface-3)',
    color: 'var(--text-strong)'
  },
  danger: {
    background: 'rgba(255,90,95,.10)',
    borderColor: 'var(--danger-500)'
  }
};
const SIZES = {
  sm: {
    height: 'var(--control-h-sm)',
    padding: '0 var(--space-6)',
    fontSize: 'var(--text-xs)',
    clipPath: 'var(--clip-notch-sm)'
  },
  md: {},
  lg: {
    height: '44px',
    padding: '0 var(--space-12)',
    fontSize: 'var(--text-md)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  type = 'button',
  href,
  style,
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const Tag = href ? 'a' : 'button';
  const s = {
    ...BASE,
    ...VARIANTS[variant],
    ...SIZES[size],
    ...(hover && !disabled ? HOVER[variant] : null),
    ...(block ? {
      display: 'flex',
      width: '100%'
    } : null),
    ...(disabled ? {
      opacity: 0.6,
      cursor: 'not-allowed'
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    href: href,
    type: href ? undefined : type,
    disabled: href ? undefined : disabled,
    style: s,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  inset = false,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      borderRadius: 'var(--radius-xl)',
      border: 'var(--border-w) solid var(--border-1)',
      background: inset ? 'var(--surface-inset)' : 'var(--surface-card)',
      overflow: 'hidden',
      ...style
    }
  }), children);
}
function CardHeader({
  title,
  description,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-8)',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      padding: 'var(--pad-card-y) var(--pad-card-x)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      display: 'flex',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      marginTop: 3,
      width: 2,
      alignSelf: 'stretch',
      flexShrink: 0,
      background: 'var(--brand-500)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--type-h2)',
      color: 'var(--text-strong)'
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, description) : null)), action);
}
function CardBody({
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card-y) var(--pad-card-x)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardBody });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  as = 'span',
  active = false,
  href,
  style,
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const Tag = href ? 'a' : as;
  const on = active || hover;
  return /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    href: href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      border: 'var(--border-w) solid ' + (on ? 'var(--brand-500)' : 'var(--border-2)'),
      background: 'var(--surface-2)',
      padding: '5px var(--space-5)',
      fontSize: 'var(--text-xs)',
      color: on ? 'var(--brand-500)' : 'var(--text-body)',
      textDecoration: 'none',
      cursor: href || as === 'button' ? 'pointer' : 'default',
      transition: 'var(--transition-color)',
      ...style
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/EmptyState.jsx
try { (() => {
function EmptyState({
  title,
  description,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-32) var(--space-12)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-h2)',
      color: 'var(--text-body)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 420,
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, description), action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)'
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/core/Notice.jsx
try { (() => {
const TONES = {
  warn: ['rgba(242,181,60,.35)', 'rgba(242,181,60,.10)', 'var(--warn-500)'],
  danger: ['rgba(255,90,95,.35)', 'rgba(255,90,95,.10)', 'var(--danger-500)'],
  info: ['var(--brand-hair)', 'var(--brand-wash)', 'var(--brand-500)']
};
function Notice({
  tone = 'danger',
  style,
  children
}) {
  const [border, bg, fg] = TONES[tone] || TONES.danger;
  return /*#__PURE__*/React.createElement("p", {
    role: tone === 'danger' ? 'alert' : undefined,
    style: {
      margin: 0,
      borderRadius: 'var(--radius-lg)',
      border: 'var(--border-w) solid ' + border,
      background: bg,
      color: fg,
      padding: 'var(--space-6) var(--space-8)',
      font: 'var(--type-body)',
      fontSize: 'var(--text-base)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Notice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Notice.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
const CHECK = "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M1.5 5.2 3.8 7.5 8.5 2.6' fill='none' stroke='%230b0c0e' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange,
  name
}) {
  const [inner, setInner] = React.useState(Boolean(defaultChecked));
  const on = checked === undefined ? inner : checked;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      font: 'var(--type-body)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .6 : 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    name: name,
    checked: on,
    disabled: disabled,
    onChange: e => {
      setInner(e.target.checked);
      onChange && onChange(e);
    },
    style: {
      appearance: 'none',
      flexShrink: 0,
      width: 16,
      height: 16,
      margin: 0,
      borderRadius: 'var(--radius-xs)',
      border: 'var(--border-w) solid ' + (on ? 'var(--brand-500)' : 'var(--border-2)'),
      background: on ? 'var(--brand-500)' : 'var(--surface-2)',
      backgroundImage: on ? CHECK : 'none',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '10px',
      cursor: 'inherit',
      transition: 'var(--transition-color)'
    }
  }), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function Field({
  label,
  hint,
  error,
  children
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginBottom: 'var(--space-3)',
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, label), children, hint && !error ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 'var(--space-3)',
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, hint) : null, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 'var(--space-3)',
      font: 'var(--type-small)',
      color: 'var(--danger-500)'
    }
  }, error) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  invalid = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({}, rest, {
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    },
    style: {
      ...{
        width: '100%',
        boxSizing: 'border-box',
        height: 'var(--control-h)',
        borderRadius: 'var(--radius-md)',
        border: 'var(--border-w) solid var(--border-1)',
        background: 'var(--surface-2)',
        padding: '0 var(--space-6)',
        font: 'var(--type-body)',
        fontSize: 'var(--text-base)',
        color: 'var(--text-strong)',
        outline: 'none',
        transition: 'var(--transition-color)'
      },
      borderColor: invalid ? 'var(--danger-500)' : focus ? 'var(--brand-500)' : 'var(--border-1)',
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      ...(rest.disabled ? {
        opacity: .6,
        cursor: 'not-allowed'
      } : null),
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CHEVRON = "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2.2 3.8 5 6.6 7.8 3.8' fill='none' stroke='%237b8493' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";
function Select({
  options = [],
  placeholder,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("select", _extends({}, rest, {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      ...{
        width: '100%',
        boxSizing: 'border-box',
        height: 'var(--control-h)',
        borderRadius: 'var(--radius-md)',
        border: 'var(--border-w) solid var(--border-1)',
        background: 'var(--surface-2)',
        padding: '0 var(--space-6)',
        font: 'var(--type-body)',
        fontSize: 'var(--text-base)',
        color: 'var(--text-strong)',
        outline: 'none',
        transition: 'var(--transition-color)'
      },
      appearance: 'none',
      paddingRight: '36px',
      backgroundImage: CHEVRON,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      backgroundSize: '10px',
      borderColor: focus ? 'var(--brand-500)' : 'var(--border-1)',
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      cursor: 'pointer',
      ...style
    }
  }), placeholder ? /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder) : null, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/match/EventFeed.jsx
try { (() => {
const CATEGORY_TONE = {
  match: 'ok',
  combat: 'danger',
  connection: 'info',
  server: 'warn',
  chat: 'neutral',
  economy: 'neutral',
  other: 'neutral'
};
function EventFeed({
  events = [],
  maxHeight = 448
}) {
  const [filter, setFilter] = React.useState('all');
  const categories = ['all', ...Array.from(new Set(events.map(e => e.category)))];
  const visible = filter === 'all' ? events : events.filter(e => e.category === filter);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-3)',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      padding: 'var(--space-6) var(--pad-card-x)'
    }
  }, categories.map(c => {
    const on = c === filter;
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      type: "button",
      onClick: () => setFilter(c),
      style: {
        cursor: 'pointer',
        borderRadius: 'var(--radius-pill)',
        border: 'var(--border-w) solid ' + (on ? 'var(--brand-500)' : 'var(--border-1)'),
        background: on ? 'var(--brand-wash)' : 'transparent',
        color: on ? 'var(--brand-500)' : 'var(--text-faint)',
        padding: '2px var(--space-5)',
        fontSize: 'var(--text-xs)',
        transition: 'var(--transition-color)'
      }
    }, c);
  })), visible.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: 'var(--space-20) var(--pad-card-x)',
      textAlign: 'center',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Nothing yet. Events appear once the server logs a round or a player connects.") : /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      maxHeight,
      overflow: 'auto'
    }
  }, visible.map((e, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-6)',
      borderTop: i ? 'var(--border-w) solid var(--ink-800)' : 0,
      padding: 'var(--space-4) var(--pad-card-x)',
      fontSize: 'var(--text-base)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "console-surface",
    style: {
      width: 64,
      flexShrink: 0,
      fontSize: 'var(--text-xs)',
      color: 'var(--ink-500)'
    }
  }, e.time), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: CATEGORY_TONE[e.category] || 'neutral'
  }, e.kind), /*#__PURE__*/React.createElement("span", {
    className: "console-surface",
    style: {
      minWidth: 0,
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, e.detail)))));
}
Object.assign(__ds_scope, { EventFeed });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/match/EventFeed.jsx", error: String((e && e.message) || e) }); }

// components/match/MatchTable.jsx
try { (() => {
const STATE_LABEL = {
  DRAFT: 'Not started',
  WARMUP: 'Warmup',
  KNIFE: 'Knife round',
  KNIFE_DECISION: 'Side decision',
  LIVE: 'Live',
  PAUSED: 'Paused',
  HALFTIME: 'Halftime',
  OVERTIME: 'Overtime',
  FINISHED: 'Finished',
  CANCELLED: 'Cancelled'
};
const STATE_TONE = {
  DRAFT: 'neutral',
  WARMUP: 'warn',
  KNIFE: 'warn',
  KNIFE_DECISION: 'warn',
  LIVE: 'ok',
  PAUSED: 'warn',
  HALFTIME: 'warn',
  OVERTIME: 'ok',
  FINISHED: 'neutral',
  CANCELLED: 'danger'
};
const LIVE_STATES = ['WARMUP', 'KNIFE', 'KNIFE_DECISION', 'LIVE', 'PAUSED', 'HALFTIME', 'OVERTIME'];
const formatScore = v => String(v).padStart(2, '0');
const th = {
  padding: 'var(--space-5) var(--space-6)',
  font: 'var(--type-small)',
  fontWeight: 'var(--weight-regular)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--text-faint)'
};
const td = {
  padding: 'var(--space-5) var(--space-6)',
  fontSize: 'var(--text-base)'
};
function MatchTable({
  rows = [],
  onOpen,
  emptyTitle = 'Nothing running',
  emptyDescription = 'Start a match from an instance and it shows up here while it is live.'
}) {
  const [showScores, setShowScores] = React.useState(true);
  const [live, setLive] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-xl)',
      border: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 'var(--space-10)',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      padding: 'var(--space-6) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    label: "Display scores",
    checked: showScores,
    onChange: e => setShowScores(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    label: "Live refresh",
    checked: live,
    onChange: e => setLive(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "every 10s"))), rows.length === 0 ? /*#__PURE__*/React.createElement(__ds_scope.EmptyState, {
    title: emptyTitle,
    description: emptyDescription
  }) : /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left'
    }
  }, "#ID"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "Team 1"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'center'
    }
  }, "Score"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left'
    }
  }, "Team 2"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left'
    }
  }, "Map"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left'
    }
  }, "Server"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left'
    }
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    style: th
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map(row => /*#__PURE__*/React.createElement(Row, {
    key: row.id,
    row: row,
    showScores: showScores,
    onOpen: onOpen
  })))));
}
function Row({
  row,
  showScores,
  onOpen
}) {
  const [hover, setHover] = React.useState(false);
  const t1 = row.team1Score > row.team2Score,
    t2 = row.team2Score > row.team1Score;
  return /*#__PURE__*/React.createElement("tr", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)',
      background: hover ? 'var(--surface-2)' : 'transparent',
      transition: 'var(--transition-color)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, "#", row.shortId), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right',
      color: t1 ? 'var(--text-strong)' : 'var(--text-muted)'
    }
  }, row.team1Name), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      textAlign: 'center',
      whiteSpace: 'nowrap'
    }
  }, showScores ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-strong)'
    }
  }, formatScore(row.team1Score), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '0 4px',
      color: 'var(--text-faint)'
    }
  }, "-"), formatScore(row.team2Score)) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, "hidden")), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: t2 ? 'var(--text-strong)' : 'var(--text-muted)'
    }
  }, row.team2Name), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: 'var(--text-muted)'
    }
  }, row.map), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, row.serverName, " \xB7 ", row.instanceName), /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: STATE_TONE[row.state],
    live: LIVE_STATES.includes(row.state) && row.state !== 'PAUSED'
  }, STATE_LABEL[row.state])), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    as: "button",
    onClick: () => onOpen && onOpen(row)
  }, "Show")));
}
Object.assign(__ds_scope, { STATE_LABEL, STATE_TONE, formatScore, MatchTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/match/MatchTable.jsx", error: String((e && e.message) || e) }); }

// components/match/Scoreboard.jsx
try { (() => {
function Scoreboard({
  map,
  state = 'LIVE',
  maxRounds = 24,
  team1,
  team2,
  team1Side = 'CT',
  roundsPlayed = 0,
  spectators
}) {
  const ctFirst = team1Side === 'CT';
  const round = (team1.score || 0) + (team2.score || 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-2xl)',
      border: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-inset)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      borderBottom: 'var(--border-w) solid var(--ink-800)',
      padding: 'var(--space-8) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-vs)',
      color: 'var(--text-faint)'
    }
  }, "Round"), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      marginLeft: 'var(--space-4)',
      color: 'var(--text-strong)'
    }
  }, round), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 var(--space-4)',
      color: 'var(--ink-600)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-strong)'
    }
  }, map)), /*#__PURE__*/React.createElement("div", {
    className: "tabular",
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-6)',
      font: 'var(--type-score)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: ctFirst ? 'var(--side-ct)' : 'var(--side-t)'
    }
  }, team1.score), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-lg)',
      color: 'var(--ink-600)'
    }
  }, ":"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: ctFirst ? 'var(--side-t)' : 'var(--side-ct)'
    }
  }, team2.score)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-vs)',
      color: 'var(--text-faint)'
    }
  }, "MR", maxRounds / 2), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: state === 'LIVE' || state === 'OVERTIME' ? 'ok' : state === 'CANCELLED' ? 'danger' : state === 'FINISHED' ? 'neutral' : 'warn',
    live: state === 'LIVE'
  }, state.toLowerCase().replace(/_/g, ' ')))), /*#__PURE__*/React.createElement(TeamBlock, {
    team: team1,
    side: ctFirst ? 'CT' : 'T',
    roundsPlayed: roundsPlayed
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)',
      borderBottom: 'var(--border-w) solid var(--ink-800)',
      background: 'var(--surface-1)',
      padding: 'var(--space-5) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      textAlign: 'center',
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-vs)',
      color: 'var(--text-faint)'
    }
  }, "vs")), /*#__PURE__*/React.createElement(TeamBlock, {
    team: team2,
    side: ctFirst ? 'T' : 'CT',
    roundsPlayed: roundsPlayed
  }), spectators && spectators.length ? /*#__PURE__*/React.createElement(TeamBlock, {
    team: {
      name: 'Unassigned / Spectators',
      players: spectators
    },
    side: "\u2014",
    roundsPlayed: roundsPlayed
  }) : null);
}
const th = {
  padding: 'var(--space-4) var(--space-4)',
  font: 'var(--type-eyebrow)',
  fontWeight: 'var(--weight-regular)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--text-faint)'
};
function TeamBlock({
  team,
  side,
  roundsPlayed
}) {
  const tone = side === 'CT' ? {
    bg: 'var(--side-ct-wash)',
    fg: 'var(--side-ct)'
  } : side === 'T' ? {
    bg: 'var(--side-t-wash)',
    fg: 'var(--side-t)'
  } : {
    bg: 'var(--surface-3)',
    fg: 'var(--text-muted)'
  };
  const players = team.players || [];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      background: tone.bg,
      color: tone.fg,
      padding: 'var(--space-5) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-base)'
    }
  }, team.logo ? /*#__PURE__*/React.createElement("img", {
    src: team.logo,
    alt: "",
    width: "20",
    height: "20",
    style: {
      display: 'block',
      objectFit: 'contain'
    }
  }) : null, team.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-vs)',
      opacity: .85
    }
  }, side)), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left',
      paddingLeft: 'var(--pad-card-x)'
    }
  }, "Player"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "K"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "A"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "D"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right',
      paddingRight: 'var(--pad-card-x)'
    }
  }, "ADR"))), /*#__PURE__*/React.createElement("tbody", null, players.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "5",
    style: {
      padding: 'var(--space-16)',
      textAlign: 'center',
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "Waiting for players\u2026")) : players.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.name,
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 'var(--space-5) var(--pad-card-x)',
      fontSize: 'var(--text-base)',
      color: p.connected === false ? 'var(--ink-500)' : 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      padding: 'var(--space-5) var(--space-4)',
      textAlign: 'right',
      color: 'var(--text-body)'
    }
  }, p.kills), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      padding: 'var(--space-5) var(--space-4)',
      textAlign: 'right',
      color: 'var(--text-body)'
    }
  }, p.assists), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      padding: 'var(--space-5) var(--space-4)',
      textAlign: 'right',
      color: 'var(--text-body)'
    }
  }, p.deaths), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      padding: 'var(--space-5) var(--pad-card-x)',
      textAlign: 'right',
      color: 'var(--text-faint)'
    }
  }, roundsPlayed > 0 ? (p.damage / roundsPlayed).toFixed(1) : '0.0'))))));
}
Object.assign(__ds_scope, { Scoreboard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/match/Scoreboard.jsx", error: String((e && e.message) || e) }); }

// components/match/StatTile.jsx
try { (() => {
function StatTile({
  label,
  value,
  hint,
  tone = 'neutral'
}) {
  const color = tone === 'brand' ? 'var(--brand-500)' : tone === 'ok' ? 'var(--ok-500)' : 'var(--text-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card-y) var(--pad-card-x)',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, label), /*#__PURE__*/React.createElement("dd", {
    className: "tabular",
    style: {
      margin: '2px 0 0',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-xl)',
      color
    }
  }, value), hint ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-small)',
      fontSize: 'var(--text-3xs)',
      color: 'var(--text-faint)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/match/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/match/TaskProgress.jsx
try { (() => {
function TaskProgress({
  label,
  percent = 0,
  state = 'running',
  eta
}) {
  const color = state === 'failed' ? 'var(--danger-500)' : state === 'done' ? 'var(--ok-500)' : 'var(--brand-500)';
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-faint)'
    }
  }, Math.round(percent), "%", eta ? ' · ' + eta : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-3)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(100, percent)) + '%',
      height: '100%',
      background: color,
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { TaskProgress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/match/TaskProgress.jsx", error: String((e && e.message) || e) }); }

// components/navigation/LanguageToggle.jsx
try { (() => {
function LanguageToggle({
  locale = 'en',
  onChange,
  labels = {
    en: 'EN',
    ru: 'RU'
  }
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      borderRadius: 'var(--radius-md)',
      border: 'var(--border-w) solid var(--border-2)',
      background: 'var(--surface-2)',
      padding: '2px',
      gap: '2px'
    }
  }, ['en', 'ru'].map(code => {
    const on = code === locale;
    return /*#__PURE__*/React.createElement("button", {
      key: code,
      type: "button",
      onClick: () => onChange && onChange(code),
      style: {
        border: 0,
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        padding: '3px var(--space-5)',
        fontSize: 'var(--text-3xs)',
        fontWeight: 'var(--weight-semibold)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide)',
        background: on ? 'var(--brand-500)' : 'transparent',
        color: on ? 'var(--text-on-brand)' : 'var(--text-faint)',
        transition: 'var(--transition-color)'
      }
    }, labels[code]);
  }));
}
Object.assign(__ds_scope, { LanguageToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/LanguageToggle.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function Sidebar({
  sections = [],
  activeHref,
  onNavigate,
  footerLabel = 'Credits',
  copyright = '© 2026 eZ-Match',
  mark = 'shard'
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: 'var(--sidebar-w)',
      flexShrink: 0,
      borderRight: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-1)',
      backdropFilter: 'blur(var(--blur-chrome))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      opacity: .5,
      background: 'radial-gradient(ellipse 80% 40% at 0% 0%, var(--brand-glow), transparent 55%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      padding: 'var(--space-7) var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    size: "sm",
    subtitle: "Admin",
    mark: mark
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'relative',
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-7) var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-10)'
    }
  }, sections.map(section => /*#__PURE__*/React.createElement("div", {
    key: section.title
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 var(--space-4)',
      padding: '0 var(--space-5)',
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-eyebrow)',
      color: 'var(--text-faint)'
    }
  }, section.title), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }
  }, section.items.map(item => /*#__PURE__*/React.createElement(SidebarItem, {
    key: item.href,
    item: item,
    active: item.href === activeHref,
    onNavigate: onNavigate
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderTop: 'var(--border-w) solid var(--border-1)',
      padding: 'var(--space-7) var(--space-6)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, footerLabel), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-4) 0 0',
      font: 'var(--type-small)',
      fontSize: 'var(--text-3xs)',
      color: 'var(--text-faint)',
      opacity: .8
    }
  }, copyright)));
}
function SidebarItem({
  item,
  active,
  onNavigate
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: item.href,
    onClick: e => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(item.href);
      }
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4) var(--space-5)',
      fontSize: 'var(--text-base)',
      textDecoration: 'none',
      borderLeft: '2px solid ' + (active ? 'var(--brand-500)' : 'transparent'),
      background: active ? 'var(--surface-3)' : hover ? 'var(--surface-2)' : 'transparent',
      color: active ? 'var(--text-strong)' : hover ? 'var(--text-strong)' : 'var(--text-muted)',
      fontWeight: active ? 'var(--weight-medium)' : 'var(--weight-regular)',
      transition: 'var(--transition-color)'
    }
  }, /*#__PURE__*/React.createElement("span", null, item.label), typeof item.count === 'number' ? /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      borderRadius: 'var(--radius-pill)',
      background: active ? 'var(--ink-700)' : 'var(--surface-3)',
      padding: '0 6px',
      fontSize: 'var(--text-3xs)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-body)'
    }
  }, item.count) : null));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNav.jsx
try { (() => {
function TopNav({
  items = [],
  activeHref,
  onNavigate,
  user,
  role,
  right,
  mark = 'shard'
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      borderBottom: 'var(--border-w) solid var(--border-1)',
      background: 'color-mix(in srgb, var(--surface-1) 78%, transparent)',
      backdropFilter: 'blur(var(--blur-chrome))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 auto',
      display: 'flex',
      height: 'var(--header-h)',
      maxWidth: 'var(--content-max)',
      alignItems: 'center',
      gap: 'var(--space-12)',
      padding: '0 var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    size: "sm",
    mark: mark
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, items.map(item => /*#__PURE__*/React.createElement(NavLink, {
    key: item.href,
    item: item,
    active: item.href === activeHref,
    onNavigate: onNavigate
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)'
    }
  }, user ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, user, role ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-4)',
      borderRadius: 'var(--radius-sm)',
      border: 'var(--border-w) solid var(--border-2)',
      background: 'var(--surface-2)',
      padding: '1px 6px',
      fontSize: 'var(--text-3xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-muted)'
    }
  }, role) : null) : null, right)));
}
function NavLink({
  item,
  active,
  onNavigate
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: item.href,
    onClick: e => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(item.href);
      }
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3) var(--space-6)',
      fontSize: 'var(--text-base)',
      textDecoration: 'none',
      borderBottom: '2px solid ' + (active ? 'var(--brand-500)' : 'transparent'),
      background: active || hover ? 'var(--surface-2)' : 'transparent',
      color: active || hover ? 'var(--text-strong)' : 'var(--text-muted)',
      transition: 'var(--transition-color)'
    }
  }, item.label, item.count ? /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      borderRadius: 'var(--radius-pill)',
      background: 'var(--ink-700)',
      padding: '0 6px',
      fontSize: 'var(--text-3xs)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-body)'
    }
  }, item.count) : null);
}
Object.assign(__ds_scope, { TopNav, NavLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/AdminHomeScreen.jsx
try { (() => {
const {
  MatchTable,
  Card,
  CardHeader,
  Chip,
  TaskProgress,
  StatTile
} = window.EZMatchDesignSystem_ab9a05;
function AdminHomeScreen({
  rows,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, "Matches in progress"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Everything currently held on a server, plus matches created but not started yet.")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Display all matches \u2192")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      margin: 0
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "Live matches",
    value: 2,
    tone: "ok"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Drafts",
    value: 1
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Running instances",
    value: 6
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Agents online",
    value: "4 / 4",
    tone: "brand"
  }))), /*#__PURE__*/React.createElement(MatchTable, {
    rows: rows,
    onOpen: onOpen
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Free servers",
    description: "Running instances with no match attached."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, [['ams-02', 'retake', 'de_dust2'], ['fra-03', 'main', 'de_anubis'], ['nyc-02', 'scrim', 'de_train']].map(([s, i, m]) => /*#__PURE__*/React.createElement(Chip, {
    key: s,
    href: "#"
  }, s, " \xB7 ", i, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--text-faint)'
    }
  }, m))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Tasks",
    description: "Agent deploys and demo syncs."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-10)',
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement(TaskProgress, {
    label: "Deploying ez-agent to fra-01",
    percent: 64,
    eta: "~40s left"
  }), /*#__PURE__*/React.createElement(TaskProgress, {
    label: "Syncing demos \xB7 nyc-01",
    percent: 100,
    state: "done"
  }), /*#__PURE__*/React.createElement(TaskProgress, {
    label: "Backup restore \xB7 ams-01",
    percent: 38,
    state: "failed"
  })))));
}
Object.assign(window, {
  AdminHomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/AdminHomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/AdminShell.jsx
try { (() => {
const {
  Sidebar,
  LanguageToggle,
  Button
} = window.EZMatchDesignSystem_ab9a05;
const SECTIONS = [{
  title: 'Main menu',
  items: [{
    href: 'admin',
    label: 'Home'
  }, {
    href: 'admin-stats',
    label: 'Statistics'
  }]
}, {
  title: 'Match menu',
  items: [{
    href: 'admin-live',
    label: 'Matches in progress',
    count: 2
  }, {
    href: 'admin-archive',
    label: 'Archived matches'
  }, {
    href: 'admin-seasons',
    label: 'Seasons overview'
  }]
}, {
  title: 'Match management',
  items: [{
    href: 'admin-new',
    label: 'Create a match'
  }, {
    href: 'admin-mine',
    label: 'My matches',
    count: 1
  }]
}, {
  title: 'Team management',
  items: [{
    href: 'admin-team-new',
    label: 'Create team'
  }, {
    href: 'admin-teams',
    label: 'Team management'
  }]
}, {
  title: 'Game servers',
  items: [{
    href: 'admin-server-new',
    label: 'Add agent'
  }, {
    href: 'admin-servers',
    label: 'Game servers'
  }]
}, {
  title: 'Settings',
  items: [{
    href: 'admin-settings',
    label: 'Settings'
  }, {
    href: 'admin-users',
    label: 'Users'
  }]
}];
function AdminShell({
  route,
  go,
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    sections: SECTIONS,
    activeHref: route,
    onNavigate: go,
    footerLabel: "Credits",
    copyright: "\xA9 2026 eZ-Match"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minWidth: 0,
      flex: 1,
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      height: 'var(--header-h)',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      background: 'color-mix(in srgb, var(--surface-1) 70%, transparent)',
      backdropFilter: 'blur(var(--blur-chrome))',
      padding: '0 var(--pad-page-x)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-base)',
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--text-muted)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(LanguageToggle, {
    locale: "en"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "denelloff", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-4)',
      borderRadius: 'var(--radius-sm)',
      border: 'var(--border-w) solid var(--border-2)',
      background: 'var(--surface-2)',
      padding: '1px 6px',
      fontSize: 'var(--text-3xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-muted)'
    }
  }, "OWNER")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => go('home')
  }, "Exit admin"))), /*#__PURE__*/React.createElement("main", {
    className: "ezmatch-enter",
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 'var(--pad-page-y) var(--pad-page-x)'
    }
  }, children)));
}
Object.assign(window, {
  AdminShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/AdminShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/AppShell.jsx
try { (() => {
const {
  TopNav,
  LanguageToggle,
  Button
} = window.EZMatchDesignSystem_ab9a05;
function AppShell({
  route,
  go,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    activeHref: route,
    onNavigate: go,
    user: "denelloff",
    role: "OWNER",
    items: [{
      href: 'home',
      label: 'Matches in progress',
      count: 2
    }, {
      href: 'archive',
      label: 'Archived matches'
    }, {
      href: 'stats',
      label: 'Statistics'
    }],
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LanguageToggle, {
      locale: "en"
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      style: {
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: 'var(--radius-lg)',
        padding: '6px 10px',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-faint)'
      }
    }, "Sign out"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => go('admin')
    }, "Admin panel"))
  }), /*#__PURE__*/React.createElement("main", {
    className: "ezmatch-enter",
    style: {
      margin: '0 auto',
      maxWidth: 'var(--content-max)',
      padding: 'var(--space-20) var(--space-8)'
    }
  }, children));
}
Object.assign(window, {
  AppShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/ControlRoomScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  Badge,
  Button,
  Chip,
  Scoreboard,
  Input,
  Notice
} = window.EZMatchDesignSystem_ab9a05;
const STATE_HINT = {
  DRAFT: 'Nothing has been sent to the server yet. Preparing applies the match convars and changes the map.',
  WARMUP: 'Warmup is frozen. After streamers unlock, both teams type !ready or !r to start (or force Go live).',
  KNIFE: 'Knife round in progress. The winner picks a side when it ends.',
  KNIFE_DECISION: 'Knife winners: type !stay or !switch (or use the panel buttons).',
  LIVE: 'Match is live. The score comes from the server, not from eZ-Match counting rounds.',
  PAUSED: 'Paused. CS2 applies the pause at the end of the current round.',
  FINISHED: 'Match finished.'
};
const LOG = ['> mp_backup_restore_load_file backup_round21.txt', 'L 21:04:11: World triggered "Round_End" (CT "12") (T "9")', 'L 21:04:11: Team "CT" triggered "SFUI_Notice_Bomb_Defused" (CT "12") (T "9")', 'L 21:04:03: "b1t<4><STEAM_1:1:143210>" triggered "Begin_Bomb_Defuse_With_Kit"', 'L 21:03:47: "ropz<9>" [1204 -320 64] killed "jL<4>" [980 -112 64] with "ak47" (headshot)', 'L 21:03:41: "b1t<4>" [512 88 -40] killed "broky<7>" [1420 -60 12] with "awp"', 'L 21:02:58: World triggered "Round_Start"', 'L 21:02:40: "karrigan<11>" say "nice one"'];
const TABS = ['Scoreboard', 'Chat', 'Backup', 'Control', 'Server'];
function ControlRoomScreen({
  match,
  onBack
}) {
  const [tab, setTab] = React.useState('Control');
  const [state, setState] = React.useState('LIVE');
  const [copied, setCopied] = React.useState(false);
  const [backups, setBackups] = React.useState(null);
  const d = window.EZ_DATA;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 auto',
      maxWidth: 'var(--content-max)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    inset: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-8)',
      padding: 'var(--space-7) var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onBack();
    },
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "\u2190 My matches"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--ink-500)'
    }
  }, "#", match.shortId), match.team1Name, " vs ", match.team2Name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-4)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-3)'
    }
  }, [match.map, match.instanceName, 'started 34 minutes ago', 'instance', 'edit'].map(m => /*#__PURE__*/React.createElement("span", {
    key: m,
    style: {
      borderRadius: 'var(--radius-sm)',
      border: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-1)',
      padding: '1px 8px',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, m)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      justifyContent: 'flex-end'
    }
  }, state === 'LIVE' ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setState('PAUSED')
  }, "Pause") : null, state === 'PAUSED' ? /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setState('LIVE')
  }, "Resume") : null, state === 'WARMUP' ? /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setState('KNIFE')
  }, "Start knife round") : null, /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    onClick: () => setState('FINISHED')
  }, "Cancel match"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)',
      padding: 'var(--space-6) var(--space-8)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("code", {
    className: "console-surface",
    style: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "connect 51.83.44.10:27015; password \"scrim\""), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setCopied(true)
  }, copied ? 'Copied' : 'Copy connect'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      borderRadius: 'var(--radius-lg)',
      border: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-card)',
      padding: 'var(--space-5) var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: state === 'LIVE' ? 'ok' : state === 'FINISHED' ? 'neutral' : 'warn',
    live: state === 'LIVE'
  }, state.toLowerCase().replace(/_/g, ' ')), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, STATE_HINT[state]), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-xl)',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--side-ct)'
    }
  }, match.team1Score), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 8px',
      color: 'var(--ink-600)'
    }
  }, ":"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--side-t)'
    }
  }, match.team2Score)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-vs)',
      color: 'var(--text-faint)'
    }
  }, "MR12")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)'
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    type: "button",
    onClick: () => setTab(t),
    style: {
      cursor: 'pointer',
      border: 'var(--border-w) solid ' + (t === tab ? 'var(--brand-hair)' : 'var(--border-1)'),
      background: t === tab ? 'var(--brand-wash)' : 'var(--surface-1)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4) var(--space-7)',
      fontSize: 'var(--text-sm)',
      color: t === tab ? 'var(--brand-500)' : 'var(--text-muted)',
      transition: 'var(--transition-color)'
    }
  }, t))), tab === 'Control' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    inset: true
  }, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Console",
    description: "rcon output, newest at the bottom."
  }), /*#__PURE__*/React.createElement("pre", {
    className: "console-surface",
    style: {
      margin: 0,
      maxHeight: 300,
      overflow: 'auto',
      padding: 'var(--space-8)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.7,
      color: 'var(--text-muted)'
    }
  }, LOG.join('\n')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      borderTop: 'var(--border-w) solid var(--ink-800)',
      padding: 'var(--space-6) var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "rcon command",
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Send"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Round backups",
    description: "Loads a round backup with mp_backup_restore_load_file, then pauses the match.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setBackups(['backup_round19.txt', 'backup_round20.txt', 'backup_round21.txt'])
    }, "List backups")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, backups === null ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "CS2 writes one backup at the start of each round once the match is live.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)'
    }
  }, backups.map(b => /*#__PURE__*/React.createElement(Chip, {
    key: b,
    as: "button",
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, b))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Demos",
    description: "GOTV recordings pulled from the agent.",
    action: /*#__PURE__*/React.createElement(Chip, {
      as: "button"
    }, "Sync now")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    href: "#",
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "match_a41f_de_mirage.dem ", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--text-faint)'
    }
  }, "241 MB")), /*#__PURE__*/React.createElement(Chip, {
    href: "#",
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "match_a41f_de_mirage.json ", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--text-faint)'
    }
  }, "1.2 MB")))), /*#__PURE__*/React.createElement(Notice, {
    tone: "warn"
  }, "Waiting for GOTV delay \u2014 a new match on fra-01 is blocked for 105 more seconds so the demo is not cut off."))) : tab === 'Scoreboard' ? /*#__PURE__*/React.createElement(Scoreboard, {
    map: match.map,
    state: state,
    maxRounds: 24,
    team1Side: "CT",
    roundsPlayed: 21,
    team1: {
      name: match.team1Name,
      score: match.team1Score,
      logo: match.team1Logo,
      players: d.players1
    },
    team2: {
      name: match.team2Name,
      score: match.team2Score,
      logo: match.team2Logo,
      players: d.players2
    }
  }) : tab === 'Chat' ? /*#__PURE__*/React.createElement(Card, {
    inset: true
  }, /*#__PURE__*/React.createElement(CardHeader, {
    title: "In-game chat",
    description: "Everything both teams say, plus admin calls."
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 'var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)'
    }
  }, [['21:02:40', 'karrigan', 'T', 'nice one'], ['21:01:58', 'b1t', 'CT', '!ready'], ['21:01:52', 'Aleksib', 'CT', '!ready'], ['20:58:11', 'ropz', 'T', '!admin plugin lag'], ['20:57:04', 'jL', 'CT', 'gl hf']].map(([t, who, side, msg], i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 'var(--space-6)',
      fontSize: 'var(--text-base)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "console-surface",
    style: {
      width: 64,
      flexShrink: 0,
      fontSize: 'var(--text-xs)',
      color: 'var(--ink-500)'
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      flexShrink: 0,
      color: side === 'CT' ? 'var(--side-ct)' : 'var(--side-t)'
    }
  }, who), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, msg))))) : /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: tab,
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "Coming soon")
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: 'var(--space-24) var(--pad-card-x)',
      textAlign: 'center',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Left intentionally blank \u2014 no design exists for this tab in the source panel.")));
}
Object.assign(window, {
  ControlRoomScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/ControlRoomScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/CreateMatchScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  Checkbox,
  Button,
  Notice
} = window.EZMatchDesignSystem_ab9a05;
const TEAMS = [{
  value: 'navi',
  label: 'NAVI'
}, {
  value: 'faze',
  label: 'FaZe'
}, {
  value: 'vitality',
  label: 'Vitality'
}, {
  value: 'spirit',
  label: 'Spirit'
}, {
  value: 'g2',
  label: 'G2'
}, {
  value: 'mouz',
  label: 'MOUZ'
}];
const MAPS = [{
  value: 'de_ancient',
  label: 'Ancient'
}, {
  value: 'de_anubis',
  label: 'Anubis'
}, {
  value: 'de_dust2',
  label: 'Dust II'
}, {
  value: 'de_inferno',
  label: 'Inferno'
}, {
  value: 'de_mirage',
  label: 'Mirage'
}, {
  value: 'de_nuke',
  label: 'Nuke'
}, {
  value: 'de_overpass',
  label: 'Overpass'
}, {
  value: 'de_train',
  label: 'Train'
}, {
  value: 'de_vertigo',
  label: 'Vertigo'
}];
function CreateMatchScreen({
  onCreate
}) {
  const [created, setCreated] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 880,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, "Create a match"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Pick CT and T from your teams, choose MR / knife, and assign a free server.")), created ? /*#__PURE__*/React.createElement(Notice, {
    tone: "info"
  }, "Match created as a draft. Start it from \u201CMy matches\u201D to push settings to the server.") : null, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Teams",
    description: "Left side starts CT."
  }), /*#__PURE__*/React.createElement(CardBody, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Team CT (left)"
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Select a team",
    options: TEAMS,
    defaultValue: "navi"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Team T (right)"
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Select a team",
    options: TEAMS,
    defaultValue: "faze"
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Match config"
  }), /*#__PURE__*/React.createElement(CardBody, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Map"
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Select a map",
    options: MAPS,
    defaultValue: "de_mirage"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Max rounds",
    hint: "MR12 = 24 total rounds (12 per half)."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 24
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Freezetime",
    hint: "Seconds before each LIVE round (Valve competitive = 15)."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 15
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tactical pause",
    hint: "!pause length in seconds."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 30
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Pauses / team",
    hint: "!pause uses per team in regulation."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 4
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tech pause budget",
    hint: "Shared !tech seconds for the match (default 600)."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 600
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-16)',
      marginTop: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Knife round",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Overtime on a tie",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Wait for GOTV delay"
  })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Server",
    description: "Only running servers without an open match."
  }), /*#__PURE__*/React.createElement(CardBody, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Server"
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Select a server",
    options: [{
      value: 'ams-02',
      label: 'ams-02 · retake'
    }, {
      value: 'fra-03',
      label: 'fra-03 · main'
    }]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Server password",
    hint: "Optional. Applied as sv_password when the match starts."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "password",
    placeholder: "optional"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => {
      setCreated(true);
      onCreate && onCreate();
    }
  }, "Create match"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Cancel")));
}
Object.assign(window, {
  CreateMatchScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/CreateMatchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/LoginScreen.jsx
try { (() => {
const {
  Logo,
  Button,
  Field,
  Input,
  Notice,
  LanguageToggle
} = window.EZMatchDesignSystem_ab9a05;
function LoginScreen({
  onSignIn
}) {
  const [error, setError] = React.useState(false);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      position: 'relative',
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse 60% 45% at 50% 20%, var(--brand-glow), transparent 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "ezmatch-enter",
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(LanguageToggle, {
    locale: "en"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      marginBottom: 'var(--space-20)'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: "lg",
    href: "#"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-6) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Counter-Strike 2 match control")), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      const v = e.target.elements.password.value;
      if (v.length < 3) {
        setError(true);
      } else {
        onSignIn();
      }
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-8)',
      borderRadius: 'var(--radius-xl)',
      border: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-card)',
      padding: 'var(--space-12)'
    }
  }, error ? /*#__PURE__*/React.createElement(Notice, {
    tone: "danger"
  }, "Invalid email or password.") : null, /*#__PURE__*/React.createElement(Field, {
    label: "Email"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    name: "email",
    defaultValue: "admin@ezmatch.gg"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Password"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "password",
    name: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    size: "lg",
    block: true
  }, "Sign in"))));
}
Object.assign(window, {
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/MatchScreen.jsx
try { (() => {
const {
  Scoreboard,
  Card,
  CardHeader,
  EventFeed,
  Chip,
  Badge
} = window.EZMatchDesignSystem_ab9a05;
const TABS = ['Scoreboard', 'Match statistics', 'Player statistics', 'Weapon statistics', 'Killer / Killed', 'Heatmap', 'Demos'];
function MatchScreen({
  match,
  onBack
}) {
  const [tab, setTab] = React.useState('Scoreboard');
  const d = window.EZ_DATA;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 auto',
      maxWidth: 'var(--reading-max)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onBack();
    },
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "\u2190 Matches in progress"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 'var(--space-4) 0 0',
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-faint)'
    }
  }, "#", match.shortId), ' ', match.team1Name, " vs ", match.team2Name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, match.map, " \xB7 ", match.instanceName, " \xB7 started 34 minutes ago")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-3)',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      paddingBottom: 'var(--space-4)'
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    type: "button",
    onClick: () => setTab(t),
    style: {
      cursor: 'pointer',
      border: 0,
      background: t === tab ? 'var(--surface-2)' : 'transparent',
      borderBottom: '2px solid ' + (t === tab ? 'var(--brand-500)' : 'transparent'),
      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
      padding: 'var(--space-4) var(--space-6)',
      fontSize: 'var(--text-sm)',
      color: t === tab ? 'var(--text-strong)' : 'var(--text-faint)',
      transition: 'var(--transition-color)'
    }
  }, t))), tab === 'Scoreboard' ? /*#__PURE__*/React.createElement(Scoreboard, {
    map: match.map,
    state: match.state,
    maxRounds: 24,
    team1Side: "CT",
    roundsPlayed: 21,
    team1: {
      name: match.team1Name,
      score: match.team1Score,
      logo: match.team1Logo,
      players: d.players1
    },
    team2: {
      name: match.team2Name,
      score: match.team2Score,
      logo: match.team2Logo,
      players: d.players2
    }
  }) : tab === 'Demos' ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Demos",
    description: "GOTV recordings pulled from the agent once the match ends.",
    action: /*#__PURE__*/React.createElement(Chip, {
      as: "button"
    }, "Sync now")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    href: "#"
  }, "match_a41f_de_mirage.dem ", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--text-faint)'
    }
  }, "241 MB")), /*#__PURE__*/React.createElement(Chip, {
    href: "#"
  }, "match_a41f_de_mirage.json ", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--text-faint)'
    }
  }, "1.2 MB")))) : /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: tab,
    description: "Recorded once the match ends. This view is not part of the current build.",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "Coming soon")
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: 'var(--space-24) var(--pad-card-x)',
      textAlign: 'center',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Left intentionally blank \u2014 no design exists for this tab in the source panel.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Server events",
    description: match.serverName + ' · ' + match.instanceName
  }), /*#__PURE__*/React.createElement(EventFeed, {
    events: d.events,
    maxHeight: 220
  })));
}
Object.assign(window, {
  MatchScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/MatchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/MatchesScreen.jsx
try { (() => {
const {
  MatchTable,
  Card,
  CardHeader,
  Chip
} = window.EZMatchDesignSystem_ab9a05;
function PageHead({
  title,
  description,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-8)',
      marginBottom: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, description)), right);
}
function MatchesScreen({
  rows,
  onOpen,
  archive = false
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHead, {
    title: archive ? 'Archived matches' : 'Matches in progress',
    description: archive ? 'Every match ever created on this panel, newest first. Statistics stay available after a match ends.' : 'Everything currently held on a server, plus matches created but not started yet.',
    right: !archive ? /*#__PURE__*/React.createElement("a", {
      href: "#",
      style: {
        font: 'var(--type-body)',
        color: 'var(--text-faint)'
      }
    }, "Display all matches \u2192") : null
  }), /*#__PURE__*/React.createElement(MatchTable, {
    rows: rows,
    onOpen: onOpen
  }), !archive ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Free servers",
    description: "Running instances with no match attached."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, [['ams-02', 'retake', 'de_dust2'], ['fra-03', 'main', 'de_anubis'], ['nyc-02', 'scrim', 'de_train']].map(([s, i, m]) => /*#__PURE__*/React.createElement(Chip, {
    key: s,
    href: "#"
  }, s, " \xB7 ", i, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--text-faint)'
    }
  }, m)))))) : null);
}
Object.assign(window, {
  MatchesScreen,
  PageHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/MatchesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/SeasonsScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  Badge,
  Button,
  EmptyState
} = window.EZMatchDesignSystem_ab9a05;
function SeasonsScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, "Seasons overview"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "This section is on the roadmap. The menu is in place so the admin shell matches the eBot layout.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Seasons",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "Coming soon")
  }), /*#__PURE__*/React.createElement(EmptyState, {
    title: "Coming soon",
    description: "No season model exists in the database yet, so nothing is designed here. Leaving it blank on purpose rather than inventing a layout.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, "Back to matches")
  })));
}
Object.assign(window, {
  SeasonsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/SeasonsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/ServersScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  Badge,
  Button,
  EmptyState
} = window.EZMatchDesignSystem_ab9a05;
const th = {
  padding: 'var(--space-6) var(--space-6)',
  textAlign: 'left',
  font: 'var(--type-small)',
  fontWeight: 'var(--weight-medium)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--text-faint)'
};
const td = {
  padding: 'var(--space-7) var(--space-6)',
  fontSize: 'var(--text-base)',
  verticalAlign: 'top'
};
const AGENTS = [{
  name: 'fra-01',
  host: '51.83.44.10:22',
  region: 'eu-west',
  status: 'ONLINE',
  version: '0.4.2',
  seen: '12 seconds ago',
  disk: '184.2 GB',
  instances: 3,
  running: 2
}, {
  name: 'ams-01',
  host: '89.106.12.7:22',
  region: 'eu-central',
  status: 'ONLINE',
  version: '0.4.2',
  seen: '31 seconds ago',
  disk: '96.8 GB',
  instances: 2,
  running: 1
}, {
  name: 'nyc-01',
  host: '167.71.4.201:2222',
  region: 'us-east',
  status: 'PENDING',
  version: null,
  seen: '4 minutes ago',
  disk: '512.0 GB',
  instances: 1,
  running: 1
}, {
  name: 'sgp-01',
  host: '128.199.88.4:22',
  region: 'ap-south',
  status: 'OFFLINE',
  version: '0.3.9',
  seen: '2 days ago',
  disk: '—',
  instances: 0,
  running: 0,
  error: 'ssh: handshake failed after 3 attempts'
}];
const INSTANCES = [{
  name: 'main',
  title: 'eZ-Match · fra-01 main',
  host: 'fra-01',
  addr: '51.83.44.10',
  port: 27015,
  tv: 27020,
  state: 'RUNNING'
}, {
  name: 'retake',
  title: 'eZ-Match · fra-01 retake',
  host: 'fra-01',
  addr: '51.83.44.10',
  port: 27025,
  tv: 27030,
  state: 'RUNNING'
}, {
  name: 'scrim',
  title: 'eZ-Match · fra-01 scrim',
  host: 'fra-01',
  addr: '51.83.44.10',
  port: 27035,
  tv: 27040,
  state: 'STOPPED'
}, {
  name: 'main',
  title: 'eZ-Match · ams-01 main',
  host: 'ams-01',
  addr: '89.106.12.7',
  port: 27015,
  tv: 27020,
  state: 'UPDATING'
}, {
  name: 'main',
  title: 'eZ-Match · nyc-01 main',
  host: 'nyc-01',
  addr: '167.71.4.201',
  port: 27015,
  tv: 27020,
  state: 'ERROR'
}];
const AGENT_TONE = {
  ONLINE: 'ok',
  OFFLINE: 'danger',
  PENDING: 'warn',
  ERROR: 'danger'
};
const INSTANCE_TONE = {
  RUNNING: 'ok',
  STARTING: 'info',
  CREATING: 'info',
  INSTALLING: 'info',
  UPDATING: 'info',
  STOPPING: 'warn',
  STOPPED: 'neutral',
  ERROR: 'danger',
  REMOVED: 'neutral'
};
function ServersScreen({
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 auto',
      maxWidth: 'var(--reading-max)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-20)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h2)',
      fontSize: 'var(--text-md)',
      color: 'var(--text-strong)'
    }
  }, "Game servers"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Hosts running ez-agent, and the CS2 instances they hold.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Game servers (", INSTANCES.length, ")"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => go && go('admin-server-new')
  }, "Add agent"))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--type-h2)',
      color: 'var(--text-strong)'
    }
  }, "Agents"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "One ez-agent per host. It installs CS2, starts instances and streams logs back.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: 'var(--border-w) solid var(--border-1)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Host"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Agent"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Last seen"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Free disk"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Game servers"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, AGENTS.map(a => /*#__PURE__*/React.createElement("tr", {
    key: a.name,
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)'
    }
  }, a.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, a.host, " \xB7 ", a.region), a.error ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 'var(--text-xs)',
      color: 'var(--danger-500)'
    }
  }, a.error) : null), /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: AGENT_TONE[a.status],
    live: a.status === 'ONLINE'
  }, a.status.toLowerCase()), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, a.version ? 'v' + a.version : '—'))), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: 'var(--text-body)'
    }
  }, a.seen), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      color: 'var(--text-body)'
    }
  }, a.disk), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "tabular"
  }, a.instances), a.running ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      fontSize: 'var(--text-xs)',
      color: 'var(--ok-500)'
    }
  }, a.running, " running") : null), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Open"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm"
  }, "Delete"))))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--type-h2)',
      color: 'var(--text-strong)'
    }
  }, "CS2 instances"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "Each instance is one CS2 process with its own ports and match slot.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, INSTANCES.length, " \xB7 2 running")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: 'var(--border-w) solid var(--border-1)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Host"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Port"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "State"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, INSTANCES.map((i, n) => /*#__PURE__*/React.createElement("tr", {
    key: n,
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)'
    }
  }, i.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, i.title)), /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--text-body)'
    }
  }, i.host), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--ink-500)'
    }
  }, i.addr)), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-body)'
    }
  }, i.port, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-500)'
    }
  }, " / tv ", i.tv)), /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: INSTANCE_TONE[i.state]
  }, i.state.toLowerCase())), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: i.state === 'RUNNING' ? 'primary' : 'secondary',
    size: "sm"
  }, "Open")))))))));
}
Object.assign(window, {
  ServersScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/ServersScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/SettingsScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  Checkbox,
  Button,
  Badge,
  Chip
} = window.EZMatchDesignSystem_ab9a05;
const MAPS = [['de_ancient', 'Ancient', 'ACTIVE_DUTY', true], ['de_anubis', 'Anubis', 'ACTIVE_DUTY', true], ['de_cache', 'Cache', 'ACTIVE_DUTY', true], ['de_dust2', 'Dust II', 'ACTIVE_DUTY', true], ['de_inferno', 'Inferno', 'ACTIVE_DUTY', true], ['de_mirage', 'Mirage', 'ACTIVE_DUTY', true], ['de_nuke', 'Nuke', 'ACTIVE_DUTY', true], ['de_overpass', 'Overpass', 'COMPETITIVE', true], ['de_train', 'Train', 'COMPETITIVE', true], ['de_vertigo', 'Vertigo', 'COMPETITIVE', false], ['de_thera', 'Thera', 'CUSTOM', false]];
const POOLS = ['All', 'Active duty', 'Competitive', 'Custom'];
function SettingsScreen() {
  const [pool, setPool] = React.useState('All');
  const [saved, setSaved] = React.useState(false);
  const visible = MAPS.filter(m => pool === 'All' || pool === 'Active duty' && m[2] === 'ACTIVE_DUTY' || pool === 'Competitive' && m[2] === 'COMPETITIVE' || pool === 'Custom' && m[2] === 'CUSTOM');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 auto',
      maxWidth: 880,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h2)',
      fontSize: 'var(--text-md)',
      color: 'var(--text-strong)'
    }
  }, "Settings"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Defaults applied to every new match, and the map pool operators can pick from.")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    href: "#"
  }, "Match defaults"), /*#__PURE__*/React.createElement(Chip, {
    href: "#"
  }, "Maps"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Match defaults",
    description: "Pre-filled when a match is created. Individual matches can still override them."
  }), /*#__PURE__*/React.createElement(CardBody, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Freezetime",
    hint: "Seconds before each LIVE round (Valve competitive = 15)."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 15
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tactical pause",
    hint: "!pause length in seconds."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 30
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Pauses / team",
    hint: "!pause uses per team in regulation."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 4
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Pauses in OT",
    hint: "!pause uses per team in overtime."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 2
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tech pause budget",
    hint: "Shared !tech seconds for the match (default 600)."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "number",
    defaultValue: 600
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Overtime MR",
    hint: "MR3 = 6 total OT rounds, MR5 = 10."
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: '3',
      label: 'MR3'
    }, {
      value: '5',
      label: 'MR5'
    }],
    defaultValue: "3"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-12)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setSaved(true)
  }, "Save defaults"), saved ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--ok-500)'
    }
  }, "Saved") : null))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Maps",
    description: "Disabled maps stay in the database but disappear from the match form."
  }), /*#__PURE__*/React.createElement(CardBody, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      marginBottom: 'var(--space-10)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)'
    }
  }, POOLS.map(p => /*#__PURE__*/React.createElement(Chip, {
    key: p,
    as: "button",
    active: p === pool,
    onClick: () => setPool(p)
  }, p))), /*#__PURE__*/React.createElement(Input, {
    type: "search",
    placeholder: "Search maps",
    style: {
      width: 200
    }
  })), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      border: 'var(--border-w) solid var(--border-1)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, visible.map(([name, label, mpool, enabled], i) => /*#__PURE__*/React.createElement("li", {
    key: name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      borderTop: i ? 'var(--border-w) solid var(--ink-800)' : 0,
      background: 'var(--surface-inset)',
      padding: 'var(--space-5) var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: enabled
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "console-surface",
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: mpool === 'ACTIVE_DUTY' ? 'brand' : mpool === 'COMPETITIVE' ? 'neutral' : 'info'
  }, mpool === 'ACTIVE_DUTY' ? 'active duty' : mpool.toLowerCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: enabled ? 'var(--ok-500)' : 'var(--text-faint)'
    }
  }, enabled ? 'enabled' : 'disabled'), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm"
  }, "Delete"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-10)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto auto',
      gap: 'var(--space-8)',
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Map name",
    hint: "Lowercase, e.g. de_cbble."
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "de_cbble"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Display label"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Cobblestone"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Pool"
  }, /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: 'CUSTOM',
      label: 'Custom'
    }, {
      value: 'COMPETITIVE',
      label: 'Competitive'
    }],
    defaultValue: "CUSTOM"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Add map")))));
}
Object.assign(window, {
  SettingsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/StatsScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  StatTile,
  EmptyState
} = window.EZMatchDesignSystem_ab9a05;
const th = {
  padding: 'var(--space-4) var(--space-6)',
  font: 'var(--type-small)',
  fontWeight: 'var(--weight-regular)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--text-faint)'
};
const td = {
  padding: 'var(--space-4) var(--space-6)',
  fontSize: 'var(--text-base)'
};
function StatsScreen() {
  const rows = window.EZ_DATA.leaderboard;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, "Global statistics"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Totals across every match this panel has run.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      margin: 0
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "Matches",
    value: 128
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Finished",
    value: 119
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Rounds played",
    value: 3104
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Kills recorded",
    value: 24871,
    tone: "brand"
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Top players",
    description: "By total kills, across all matches. Showing up to 25."
  }), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'left'
    }
  }, "Player"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "Matches"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "K"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "D"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "A"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "K/D"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(([name, steam, matches, kills, deaths, assists]) => /*#__PURE__*/React.createElement("tr", {
    key: steam,
    style: {
      borderTop: 'var(--border-w) solid var(--ink-800)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: 'var(--text-body)'
    }
  }, name, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-4)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, steam)), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      textAlign: 'right',
      color: 'var(--text-faint)'
    }
  }, matches), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      textAlign: 'right',
      color: 'var(--text-strong)'
    }
  }, kills), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      textAlign: 'right',
      color: 'var(--text-faint)'
    }
  }, deaths), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      textAlign: 'right',
      color: 'var(--text-faint)'
    }
  }, assists), /*#__PURE__*/React.createElement("td", {
    className: "tabular",
    style: {
      ...td,
      textAlign: 'right',
      color: 'var(--text-muted)'
    }
  }, (kills / deaths).toFixed(2))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Statistics by weapon"
  }), /*#__PURE__*/React.createElement(EmptyState, {
    title: "Nothing recorded yet",
    description: "Weapon totals build up as matches are played on this panel."
  })));
}
Object.assign(window, {
  StatsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/StatsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/TeamsScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  Badge,
  Button,
  Notice
} = window.EZMatchDesignSystem_ab9a05;
const TEAMS = [['Natus Vincere', 'NAVI', 'ua', 'Ukraine', 'navi', true], ['FaZe Clan', 'FAZE', 'us', 'United States', 'faze', true], ['Team Vitality', 'VIT', 'fr', 'France', 'vitality', true], ['Team Spirit', 'SPIRIT', 'ru', 'Russia', 'spirit', true], ['G2 Esports', 'G2', 'de', 'Germany', 'g2', true], ['MOUZ', 'MOUZ', 'de', 'Germany', 'mouz', true], ['Team Liquid', 'TL', 'us', 'United States', 'liquid', true], ['Astralis', 'AST', 'dk', 'Denmark', 'astralis', true]];
function TeamsScreen({
  go
}) {
  const [imported, setImported] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, "Team management"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Edit or delete teams, or import a preset of known CS2 organisations.")), /*#__PURE__*/React.createElement(Button, {
    onClick: () => go && go('admin-team-new')
  }, "Create team")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "CS2 pro preset",
    description: "Import well-known professional CS2 teams with real logos (cached locally; you can replace them later)."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)',
      padding: 'var(--pad-card-y) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setImported(true)
  }, "Load CS2 pro teams"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-small)',
      color: 'var(--text-faint)'
    }
  }, "Already imported organisations are skipped. Logos are generated badges you can replace.")), imported ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--pad-card-x) var(--pad-card-y)'
    }
  }, /*#__PURE__*/React.createElement(Notice, {
    tone: "info"
  }, "Imported 46, skipped 8, repaired logos 3.")) : null), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Teams",
    description: TEAMS.length + ' teams'
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, TEAMS.map(([name, tag, cc, country, slug, preset], i) => /*#__PURE__*/React.createElement("li", {
    key: tag,
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      borderTop: i ? 'var(--border-w) solid var(--border-1)' : 0,
      padding: 'var(--space-6) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minWidth: 0,
      alignItems: 'center',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 40,
      width: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 'var(--radius-md)',
      border: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: '../../assets/teams/' + slug + '.png',
    alt: "",
    style: {
      height: '100%',
      width: '100%',
      objectFit: 'contain'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)'
    }
  }, name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, "(", tag, ")")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "console-surface"
  }, cc), /*#__PURE__*/React.createElement("span", null, country), preset ? /*#__PURE__*/React.createElement(Badge, {
    tone: "info"
  }, "preset") : null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexShrink: 0,
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Edit"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm"
  }, "Delete")))))));
}
Object.assign(window, {
  TeamsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/TeamsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/UsersScreen.jsx
try { (() => {
const {
  Card,
  CardHeader,
  Badge,
  Button
} = window.EZMatchDesignSystem_ab9a05;
const USERS = [['denelloff', 'admin@ezmatch.gg', 'OWNER', true, false, true], ['kirill', 'kirill@ezmatch.gg', 'ADMIN', true, false, false], ['operator-eu', 'eu@ezmatch.gg', 'OPERATOR', false, false, false], ['operator-na', 'na@ezmatch.gg', 'OPERATOR', false, true, false], ['viewer', 'stats@ezmatch.gg', 'USER', false, false, false]];
function UsersScreen({
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-strong)'
    }
  }, "Users"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-3) 0 0',
      font: 'var(--type-body)',
      color: 'var(--text-faint)'
    }
  }, "Accounts that can sign in to this panel, and what each one is allowed to do.")), /*#__PURE__*/React.createElement(Button, null, "Create user")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Accounts",
    description: USERS.length + ' users'
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, USERS.map(([name, email, role, canCreate, disabled, self], i) => /*#__PURE__*/React.createElement("li", {
    key: email,
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      borderTop: i ? 'var(--border-w) solid var(--border-1)' : 0,
      padding: 'var(--space-6) var(--pad-card-x)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)'
    }
  }, name, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-4)',
      fontWeight: 'var(--weight-regular)',
      color: 'var(--text-faint)'
    }
  }, email), self ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'var(--space-4)',
      fontSize: 'var(--text-xs)',
      color: 'var(--ink-500)'
    }
  }, "(you)") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: role === 'OWNER' ? 'brand' : 'neutral'
  }, role), canCreate ? /*#__PURE__*/React.createElement(Badge, {
    tone: "info"
  }, "can create users") : null, disabled ? /*#__PURE__*/React.createElement(Badge, {
    tone: "danger"
  }, "disabled") : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, self ? 'Edit profile' : 'Edit'), role !== 'OWNER' ? /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm"
  }, "Delete") : /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--ink-500)',
      alignSelf: 'center'
    }
  }, "locked")))))));
}
Object.assign(window, {
  UsersScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/UsersScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/panel/data.js
try { (() => {
window.EZ_DATA = {
  matches: [{
    id: '1',
    shortId: 'a41f',
    team1Name: 'NAVI',
    team2Name: 'FaZe',
    team1Score: 12,
    team2Score: 9,
    map: 'de_mirage',
    serverName: 'fra-01',
    instanceName: 'main',
    state: 'LIVE',
    team1Logo: '../../assets/teams/navi.png',
    team2Logo: '../../assets/teams/faze.png'
  }, {
    id: '2',
    shortId: 'b902',
    team1Name: 'Vitality',
    team2Name: 'Spirit',
    team1Score: 5,
    team2Score: 5,
    map: 'de_nuke',
    serverName: 'fra-02',
    instanceName: 'scrim',
    state: 'KNIFE',
    team1Logo: '../../assets/teams/vitality.png',
    team2Logo: '../../assets/teams/spirit.png'
  }, {
    id: '3',
    shortId: 'c113',
    team1Name: 'G2',
    team2Name: 'MOUZ',
    team1Score: 0,
    team2Score: 0,
    map: 'de_ancient',
    serverName: 'ams-01',
    instanceName: 'main',
    state: 'DRAFT',
    team1Logo: '../../assets/teams/g2.png',
    team2Logo: '../../assets/teams/mouz.png'
  }, {
    id: '4',
    shortId: 'd774',
    team1Name: 'Liquid',
    team2Name: 'Astralis',
    team1Score: 16,
    team2Score: 14,
    map: 'de_inferno',
    serverName: 'nyc-01',
    instanceName: 'main',
    state: 'FINISHED',
    team1Logo: '../../assets/teams/liquid.png',
    team2Logo: '../../assets/teams/astralis.png'
  }],
  players1: [{
    name: 'b1t',
    kills: 19,
    assists: 4,
    deaths: 14,
    damage: 1740,
    connected: true
  }, {
    name: 'w0nderful',
    kills: 17,
    assists: 3,
    deaths: 15,
    damage: 1602,
    connected: true
  }, {
    name: 'Aleksib',
    kills: 12,
    assists: 9,
    deaths: 16,
    damage: 1288,
    connected: true
  }, {
    name: 'jL',
    kills: 15,
    assists: 5,
    deaths: 15,
    damage: 1451,
    connected: true
  }, {
    name: 'iM',
    kills: 11,
    assists: 6,
    deaths: 17,
    damage: 1170,
    connected: false
  }],
  players2: [{
    name: 'ropz',
    kills: 21,
    assists: 2,
    deaths: 13,
    damage: 1893,
    connected: true
  }, {
    name: 'broky',
    kills: 16,
    assists: 4,
    deaths: 14,
    damage: 1522,
    connected: true
  }, {
    name: 'rain',
    kills: 13,
    assists: 7,
    deaths: 16,
    damage: 1330,
    connected: true
  }, {
    name: 'frozen',
    kills: 14,
    assists: 5,
    deaths: 15,
    damage: 1408,
    connected: true
  }, {
    name: 'karrigan',
    kills: 9,
    assists: 8,
    deaths: 18,
    damage: 1044,
    connected: true
  }],
  events: [{
    time: '21:04:11',
    kind: 'round_end',
    category: 'match',
    detail: 'winner=CT score=12-9 reason=defused'
  }, {
    time: '21:04:03',
    kind: 'bomb_defused',
    category: 'match',
    detail: 'b1t site=A time=3.4'
  }, {
    time: '21:03:47',
    kind: 'player_death',
    category: 'combat',
    detail: 'ropz → jL weapon=ak47 hs=true'
  }, {
    time: '21:03:41',
    kind: 'player_death',
    category: 'combat',
    detail: 'b1t → broky weapon=awp hs=false'
  }, {
    time: '21:02:58',
    kind: 'round_start',
    category: 'match',
    detail: 'round=22 ct_money=18400 t_money=12200'
  }, {
    time: '21:02:40',
    kind: 'player_say',
    category: 'chat',
    detail: 'karrigan: nice one'
  }, {
    time: '21:01:12',
    kind: 'player_connect',
    category: 'connection',
    detail: 'iM steamid=765611980…'
  }, {
    time: '20:58:02',
    kind: 'server_cvar',
    category: 'server',
    detail: 'mp_freezetime=15'
  }],
  leaderboard: [['ropz', '76561198043442379', 48, 912, 714, 166], ['b1t', '76561198246687035', 44, 878, 731, 152], ['donk', '76561199063238565', 39, 864, 646, 131], ['m0NESY', '76561198141317276', 41, 801, 690, 144], ['ZywOo', '76561198133177841', 37, 796, 612, 178]]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/panel/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardBody = __ds_scope.CardBody;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Notice = __ds_scope.Notice;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.EventFeed = __ds_scope.EventFeed;

__ds_ns.STATE_LABEL = __ds_scope.STATE_LABEL;

__ds_ns.STATE_TONE = __ds_scope.STATE_TONE;

__ds_ns.MatchTable = __ds_scope.MatchTable;

__ds_ns.Scoreboard = __ds_scope.Scoreboard;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.TaskProgress = __ds_scope.TaskProgress;

__ds_ns.LanguageToggle = __ds_scope.LanguageToggle;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.TopNav = __ds_scope.TopNav;

__ds_ns.NavLink = __ds_scope.NavLink;

})();
