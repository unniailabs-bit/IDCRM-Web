# Identity Card Template 3 - React Component

A reusable React component for generating school identity cards with Template 3 design (vertical card with red header).

## Features

- 🎨 Vertical card design (360px × 620px)
- 🔴 Red header section with school information
- 📸 Dynamic student photo
- 🏫 School logo and academic year
- 👤 Student details (roll number, name, standard, DOB, address, mobile)
- ✍️ Signature and designation area
- ♻️ Fully reusable with props

## Usage

### Basic Example

```jsx
import IdentityCardTemplate3 from './IdentityCardTemplate3';

function App() {
  return (
    <IdentityCardTemplate3
      headerSmall="Shree Shyam Education Trust"
      headerMain="SHIVAJI VIDYA MANDIR HIGH SCHOOL"
      headerAddress="Appa Pada, Malad (East), Mumbai - 97"
      medium="MEDIUM - SEMI ENGLISH"
      schoolLogo="./logo.png"
      academicYear="2024 - 25"
      studentPhoto="./pic.jpeg"
      rollNumber="123303"
      studentName="SINGH UTKARSH DEVIPRASAD"
      standard="10th - A"
      dateOfBirth="18.1.2009"
      address="Navjeevan Chawl, Appapada, Malad (E), Mum - 97"
      mobileNumber="9920767317"
      signatureImage="./sign.png"
      designation="Head Master"
    />
  );
}
```

### With Multiple Students

```jsx
const students = [
  {
    rollNumber: '123303',
    studentName: 'STUDENT ONE',
    standard: "10th - A",
    dateOfBirth: '18.1.2009',
    address: 'Address Line 1, Address Line 2',
    mobileNumber: '9920767317',
  },
  {
    rollNumber: '123304',
    studentName: 'STUDENT TWO',
    standard: "9th - B",
    dateOfBirth: '20.2.2010',
    address: 'Different Address, City',
    mobileNumber: '9876543210',
  },
];

function App() {
  return (
    <div>
      {students.map((student, index) => (
        <IdentityCardTemplate3
          key={index}
          headerMain="YOUR SCHOOL NAME"
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
| `headerSmall` | string | `'Shree Shyam Education Trust'` | Small header text (trust/organization name) |
| `headerMain` | string | `'SHIVAJI VIDYA MANDIR HIGH SCHOOL'` | Main school name (displayed in uppercase) |
| `headerAddress` | string | `'Appa Pada, Malad (East), Mumbai - 97'` | School address line |
| `medium` | string | `'MEDIUM - SEMI ENGLISH'` | Medium of instruction (displayed in yellow) |
| `schoolLogo` | string | `'./logo.png'` | Path to school logo image |
| `academicYear` | string | `'2024 - 25'` | Academic year (displayed rotated) |
| `studentPhoto` | string | `'./pic.jpeg'` | Path to student photo |
| `rollNumber` | string | `'123303'` | Student roll number/ID |
| `studentName` | string | `'SINGH UTKARSH DEVIPRASAD'` | Student's full name (uppercase) |
| `standard` | string | `"10th - A"` | Student's standard/class |
| `dateOfBirth` | string | `'18.1.2009'` | Date of birth |
| `address` | string | `'Navjeevan Chawl, Appapada, Malad (E), Mum - 97'` | Student's address (auto-formatted with line break) |
| `mobileNumber` | string | `'9920767317'` | Mobile number |
| `signatureImage` | string | `'./sign.png'` | Path to signature image |
| `designation` | string | `'Head Master'` | Designation text |

## Card Dimensions

- **Width**: 360px
- **Height**: 620px
- **Border Radius**: 8px
- **Header Height**: 110px (red background)

## File Structure

```
.
├── IdentityCardTemplate3.jsx      # Main component
├── IdentityCardTemplate3.css      # Component styles
├── Template3Page.jsx               # Example usage page
└── App.jsx                         # Router configuration
```

## Notes

- All image paths are relative to the component location
- Ensure all image files (logo, photos, signature) are accessible
- The component maintains the exact design and positioning from the original HTML
- Student photo should be square (120px × 120px recommended)
- Address will automatically break at the first comma for multi-line display
- Header has a red background (#d32f2f) with white text
- Academic year is displayed rotated 90 degrees on the right side

## Differences from Other Templates

- **Vertical orientation** (360px × 620px vs horizontal layouts)
- **Red header section** at the top with school information
- **Rotated academic year** on the right side
- **Compact layout** suitable for portrait orientation
- **Simplified address format** with automatic line breaks

## URL Access

After setting up routing, access Template 3 at:
- **URL**: `http://localhost:5173/template3` or `/template3`

