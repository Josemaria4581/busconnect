import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login.jsx';

// Mock dependencias
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        register: mockRegister
    })
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', setTheme: vi.fn() })
}));

describe('Login Component', () => {
    it('muestra el formulario de login correctamente', () => {
        render(<Login />);
        expect(screen.getByPlaceholderText('Correo')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Acceder' }).length).toBeGreaterThan(0);
    });

    it('cambia a modo registro al hacer click en Crear cuenta', () => {
        render(<Login />);
        const btnRegisterMode = screen.getByText('Crear cuenta');
        fireEvent.click(btnRegisterMode);
        
        expect(screen.getByPlaceholderText('Nombre completo')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeInTheDocument();
    });

    it('llama a la función login al enviar el formulario', async () => {
        mockLogin.mockResolvedValueOnce({ role: 'cliente' });
        const { container } = render(<Login />);
        
        fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'pass' } });
        const form = container.querySelector('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'pass');
        });
    });
});
