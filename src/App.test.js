import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Darsy welcome screen', () => {
  render(<App />);
  expect(screen.getByText(/ابحث عن أفضل مدرس/)).toBeInTheDocument();
});
