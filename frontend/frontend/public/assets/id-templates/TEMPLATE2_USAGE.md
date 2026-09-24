# Identity Card Template 2 - React Component

A reusable React component for generating school identity cards with Template 2 design.

## Features

- 🎨 Modern card design with background image support
- 📸 Dynamic student photo
- 🏫 School logo and information
- 👤 Student details (ID, name, guardian, class, emergency contact)
- 📋 Footer with affiliation and school code
- ✍️ Principal signature area
- ♻️ Fully reusable with props

## Usage

### Basic Example

```jsx
import IdentityCardTemplate2 from './IdentityCardTemplate2';

function App() {
  return (
    <IdentityCardTemplate2
      schoolLogo="./logo.png"
      schoolName="WEBBIENCE NATIONAL PUBLIC SCHOOL"
      schoolAddress="Your School address, Street Name, City"
      schoolAddressLine2="School District, State, Pincode - 600006"
      studentPhoto="./photo.png"
      studentId="123456"
      studentName="Alveena S. Kudhus"
      fatherGuardian="Salam Kudhus"
      studentClass="1st 'A'"
      emergencyCall="97905 47171"
      affiliation="Affiliated to CBSE, New Delhi"
      schoolCode="654321"
      backgroundImage="./template2-bg.jpeg"
    />
  );
}
```

### With Multiple Students

```jsx
const students = [
  {
    studentId: '123456',
    studentName: 'Student 1',
    fatherGuardian: 'Parent 1',
    studentClass: "1st 'A'",
    emergencyCall: '1234567890',
  },
  {
    studentId: '789012',
    studentName: 'Student 2',
    fatherGuardian: 'Parent 2',
    studentClass: "2nd 'B'",
    emergencyCall: '9876543210',
  },
];

function App() {
  return (
    <div>
      {students.map((student, index) => (
        <IdentityCardTemplate2
          key={index}
          schoolLogo="./logo.png"
          schoolName="YOUR SCHOOL NAME"
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
| `schoolName` | string | `'WEBBIENCE NATIONAL PUBLIC SCHOOL'` | School name (displayed in uppercase) |
| `schoolAddress` | string | `'Your School address, Street Name, City'` | First line of school address |
| `schoolAddressLine2` | string | `'School District, State, Pincode - 600006'` | Second line of school address |
| `studentPhoto` | string | `'./photo.png'` | Path to student photo |
| `studentId` | string | `'123456'` | Student ID number |
| `studentName` | string | `'Alveena S. Kudhus'` | Student's full name |
| `fatherGuardian` | string | `'Salam Kudhus'` | Father/Guardian name |
| `studentClass` | string | `"1st 'A'"` | Student's class |
| `emergencyCall` | string | `'97905 47171'` | Emergency contact number |
| `affiliation` | string | `'Affiliated to CBSE, New Delhi'` | School affiliation information |
| `schoolCode` | string | `'654321'` | School code |
| `backgroundImage` | string | `'./template2-bg.jpeg'` | Background image for the card |
| `signature` | string | `'Signature Here'` | Signature text (cursive style) |
| `principalLabel` | string | `'PRINCIPAL'` | Principal label text |

## Card Dimensions

- **Width**: 720px
- **Height**: 420px
- **Border Radius**: 14px

## File Structure

```
.
├── IdentityCardTemplate2.jsx      # Main component
├── IdentityCardTemplate2.css      # Component styles
├── App.jsx                        # Example usage
└── template2-bg.jpeg             # Background image (required)
```

## Notes

- All image paths are relative to the component location
- Ensure all image files (logo, photos, background) are accessible
- The component maintains the exact design and positioning from the original HTML
- Student photo should be square (210px × 210px recommended)
- Background image should be 720px × 420px for best results

## Differences from Template 1

- Different layout (photo on left, details on right)
- Includes student ID field
- Uses "Father/Guardian" instead of separate father/mother fields
- Includes emergency call instead of regular phone
- Footer includes affiliation and school code
- Different background image support

