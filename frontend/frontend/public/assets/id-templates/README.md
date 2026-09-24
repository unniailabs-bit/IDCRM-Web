# Identity Card Generator - React Component

A reusable React component for generating school identity cards with dynamic values.

## Features

- 🎨 Fully customizable design
- 📸 Dynamic student photo
- 🏫 School logo and information
- 👤 Student details (name, parents, class, DOB, address, phone)
- 🖼️ Background image support
- ♻️ Reusable component with props

## Installation

```bash
npm install
```

## Usage

### Basic Example

```jsx
import IdentityCard from './IdentityCard';

function App() {
  return (
    <IdentityCard
      schoolLogo="./logo.png"
      schoolName="ABC Public School"
      registrationNumber="Reg. No. 1234567890"
      cardTitleImage="./identity-card.png"
      studentPhoto="./pic.jpeg"
      studentName="John Doe"
      fatherName="John Senior"
      motherName="Jane Doe"
      studentClass="X"
      dateOfBirth="01/01/2010"
      address="New York, USA"
      phoneNumber="1234567890"
      backgroundImage="./bg-front.png"
    />
  );
}
```

### With Multiple Students

```jsx
const students = [
  {
    studentName: 'Student 1',
    fatherName: 'Father 1',
    // ... other details
  },
  {
    studentName: 'Student 2',
    fatherName: 'Father 2',
    // ... other details
  },
];

function App() {
  return (
    <div>
      {students.map((student, index) => (
        <IdentityCard
          key={index}
          schoolLogo="./logo.png"
          schoolName="ABC Public School"
          {...student}
        />
      ))}
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `schoolLogo` | string | `'./logo.png'` | Path to school logo image |
| `schoolName` | string | `'Text for your School Name'` | School name |
| `registrationNumber` | string | `'Reg. No. 1234567890'` | School registration number |
| `cardTitleImage` | string | `'./identity-card.png'` | Card title image |
| `studentPhoto` | string | `'./pic.jpeg'` | Path to student photo |
| `studentName` | string | `'Sourabh Pal'` | Student's full name |
| `fatherName` | string | `'Shubham Singh Pal'` | Father's name |
| `motherName` | string | `'Kanchan'` | Mother's name |
| `studentClass` | string | `'VI'` | Student's class |
| `dateOfBirth` | string | `'30/06/2014'` | Date of birth (DD/MM/YYYY) |
| `address` | string | `'Seoni. MP.'` | Student's address |
| `phoneNumber` | string | `'9123456789'` | Phone number |
| `backgroundImage` | string | `'./bg-front.png'` | Background image for the card |

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Structure

```
.
├── IdentityCard.jsx      # Main component
├── IdentityCard.css      # Component styles
├── App.jsx               # Example usage
├── main.jsx              # React entry point
├── index.html            # HTML template
├── package.json          # Dependencies
└── vite.config.js        # Vite configuration
```

## Notes

- All image paths are relative to the component location
- Ensure all image files (logo, photos, background) are in the public folder or accessible
- The component maintains the exact design and positioning from the original HTML

