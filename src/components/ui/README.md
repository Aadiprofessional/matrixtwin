# React Icons Wrapper Components

This directory contains wrapper components for safely using React Icons in TypeScript.

## The Problem

React Icons typically return a `ReactNode` type, which TypeScript doesn't accept as a valid JSX element. This can cause TypeScript errors like:

```
TS2786: 'Ri.RiUser3Line' cannot be used as a JSX component.
Its return type 'ReactNode' is not a valid JSX element.
Type 'undefined' is not assignable to type 'Element | null'.
```

## The Solution

We've created three different ways to safely use React Icons:

### 1. Using the IconWrapper Component

```tsx
import IconWrapper from '../components/ui/IconWrapper';

// Use as a component with the icon name as a string
<IconWrapper icon="RiUserLine" className="text-blue-500" />
```

### 2. Using the pre-wrapped Icon components

```tsx
import { RiUserLine, RiSettingsLine } from '../components/ui/Icons';
// or import Icons from '../components/ui/Icons';

// Use as React components
<RiUserLine className="text-blue-500" />
// Or using the namespace
<Icons.RiSettingsLine className="text-blue-500" />
```

### 3. Using the IconComponent directly

```tsx
import { RiUserLine } from 'react-icons/ri';
import IconComponent from '../components/common/IconComponent';

// Use IconComponent and pass the icon as a prop
<IconComponent icon={RiUserLine} className="text-blue-500" />
```

## Converting Direct React Icons Usage

When refactoring code that directly uses React Icons, replace:

```tsx
import { RiUserLine } from 'react-icons/ri';

<RiUserLine />
```

With:

```tsx
import { RiUserLine } from '../components/ui/Icons';

<RiUserLine />
```

This ensures type safety while maintaining the same usage pattern.

## Available Props

All wrapper components accept the following props:

| Prop | Type | Description |
|------|------|-------------|
| className | string | CSS classes to apply to the icon |
| color | string | Icon color |
| size | string or number | Icon size |
| style | React.CSSProperties | Custom style object |
| onClick | () => void | Click handler |
| title | string | Tooltip title | 