import { render, screen } from '@testing-library/react';
import App from './App';

test('the entrance offers one door per interface', () => {
  render(<App />);
  expect(screen.getByText(/كيف تريد استخدام درسي/)).toBeInTheDocument();
  ['الدخول كـطالب', 'الدخول كـولي أمر', 'الدخول كـمدرس'].forEach((door) => {
    expect(screen.getByRole('button', { name: door })).toBeInTheDocument();
  });
});
