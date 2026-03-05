# Planning Guide

A web application that converts text input into tactile Braille representations, generating 3D models (STL format) that can be visualized in the browser and downloaded for 3D printing.

**Experience Qualities**: 
1. **Accessible** - The tool bridges digital text and physical Braille, making content creation for visually impaired individuals straightforward and immediate
2. **Tactile** - The 3D visualization and model generation emphasize the physical, touchable nature of Braille
3. **Precise** - Accurate Braille translation and properly dimensioned models ensure the output is functionally usable

**Complexity Level**: Light Application (multiple features with basic state)
- The app focuses on text-to-Braille conversion with 3D visualization and STL export, managing input state and 3D rendering but without complex multi-view navigation or advanced data persistence needs.

## Essential Features

### Text Input & Braille Translation
- **Functionality**: Real-time conversion of typed text into Braille dot patterns
- **Purpose**: Provides immediate feedback and allows users to verify their text is being correctly translated
- **Trigger**: User types or pastes text into the input field
- **Progression**: User enters text → System translates to Braille character codes → Braille pattern updates in real-time
- **Success criteria**: All standard alphanumeric characters and common punctuation accurately map to Grade 1 Braille

### 3D Model Visualization
- **Functionality**: Interactive 3D preview of the Braille embossed on a surface
- **Purpose**: Allows users to visually inspect the model before downloading, understanding spacing and layout
- **Trigger**: Braille translation completes
- **Progression**: Braille data generated → 3D geometry constructed → Three.js renders interactive model → User can rotate/zoom to inspect
- **Success criteria**: Model displays clearly with proper dot height, spacing, and proportions; smooth interaction via mouse/touch

### STL File Export
- **Functionality**: Generate and download a standard STL file of the Braille model
- **Purpose**: Enables 3D printing of tactile Braille labels, signs, or educational materials
- **Trigger**: User clicks download/export button
- **Progression**: User clicks export → System generates STL geometry from Braille data → Binary STL file created → Browser downloads file
- **Success criteria**: STL file is valid, opens in standard 3D software, and has proper dimensions for tactile reading

## Edge Case Handling

- **Empty Input**: Display empty state with helpful prompt, disable export until text is entered
- **Unsupported Characters**: Replace with space or skip unsupported characters, optionally show warning
- **Very Long Text**: Limit input length or wrap text across multiple lines in the 3D model
- **Mobile/Touch Interaction**: Ensure 3D controls work with touch gestures for rotation and zoom

## Design Direction

The design should feel modern and technical while being warm and approachable. It should communicate precision and craftsmanship, emphasizing the transformation from digital to physical. The interface should feel like a specialized tool - professional but not intimidating, with clear visual hierarchy guiding users through input, preview, and export.

## Color Selection

A sophisticated technical palette with warm accents to balance precision with approachability.

- **Primary Color**: Deep Navy Blue `oklch(0.25 0.06 250)` - Communicates technical precision and trustworthiness, used for main actions
- **Secondary Colors**: Warm Gray `oklch(0.92 0.01 60)` for backgrounds and Cool Gray `oklch(0.45 0.02 250)` for supporting text
- **Accent Color**: Amber/Copper `oklch(0.70 0.15 55)` - Warm, tactile feeling that draws attention to the 3D model and export actions
- **Foreground/Background Pairings**: 
  - Background (Light Warm Gray #F5F4F0 / oklch(0.96 0.01 60)): Deep Navy text (oklch(0.25 0.06 250)) - Ratio 9.8:1 ✓
  - Primary (Deep Navy oklch(0.25 0.06 250)): White text (oklch(1 0 0)) - Ratio 12.5:1 ✓
  - Accent (Amber oklch(0.70 0.15 55)): Deep Navy text (oklch(0.25 0.06 250)) - Ratio 4.9:1 ✓

## Font Selection

Typefaces should balance technical clarity with humanist warmth - clear enough for precise work while remaining inviting.

- **Typographic Hierarchy**: 
  - H1 (App Title): Space Grotesk Bold/32px/tight tracking for technical feel
  - H2 (Section Headers): Space Grotesk Semibold/20px/normal tracking
  - Body (Instructions, Labels): Inter Regular/15px/relaxed line height (1.6)
  - Input Text: JetBrains Mono Regular/16px/monospace for text entry precision
  - UI Elements: Inter Medium/14px for buttons and controls

## Animations

Animations should reinforce the transformation from text to physical object - subtle state transitions with purposeful emphasis on the 3D model generation.

Key animated moments: smooth fade-in when 3D model updates after text changes (300ms ease), gentle spring animation on export button interaction, subtle rotation hint on 3D viewer first load to indicate interactivity, loading state with progress feedback during STL generation.

## Component Selection

- **Components**: 
  - Textarea (from Shadcn) for text input with clear focus states
  - Button (from Shadcn) with variant="default" for export, customized with accent color
  - Card (from Shadcn) to contain the 3D viewer and input sections
  - Label (from Shadcn) for form field descriptions
  - Separator to divide input and preview sections
  - Toast (Sonner) for export success/error feedback
  
- **Customizations**: 
  - Custom 3D viewer component wrapping Three.js canvas
  - Custom Braille translation logic component
  - STL export utility function for binary file generation
  
- **States**: 
  - Textarea: subtle border glow on focus using accent color, smooth transition
  - Export Button: disabled state when no text, hover lift effect with shadow, active press state
  - 3D Viewer: loading skeleton while geometry generates, subtle ambient glow on Braille dots
  
- **Icon Selection**: 
  - Download icon for STL export
  - Cube icon to represent 3D model
  - Type icon for text input area
  - Eye icon for preview/visibility toggle if needed
  
- **Spacing**: 
  - Container padding: p-8 (desktop), p-6 (mobile)
  - Card gap between sections: gap-6
  - Input group spacing: space-y-2
  - Button padding: px-6 py-3
  
- **Mobile**: 
  - Stack input and 3D viewer vertically on mobile
  - 3D viewer maintains 16:9 aspect ratio, full width on small screens
  - Touch controls for 3D rotation (two-finger rotate, pinch zoom)
  - Sticky export button at bottom on mobile
  - Reduce typography scale: H1 to 24px, body to 14px
