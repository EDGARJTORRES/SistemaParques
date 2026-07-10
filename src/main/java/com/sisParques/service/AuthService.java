package com.sisParques.service;

import com.sisParques.dto.LoginRequest;
import com.sisParques.dto.LoginResponse;
import com.sisParques.entity.PasswordResetToken;
import com.sisParques.entity.Usuario;
import com.sisParques.repository.PasswordResetTokenRepository;
import com.sisParques.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.util.Random;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TotpService totpService;

    public AuthService(UsuarioRepository usuarioRepository,
                    PasswordEncoder passwordEncoder,
                    JwtService jwtService,
                    PasswordResetTokenRepository passwordResetTokenRepository,
                    TotpService totpService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.totpService = totpService;
    }

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (!usuario.getActivo()) {
            throw new RuntimeException("Usuario inactivo");
        }

        if (Boolean.TRUE.equals(usuario.getTotpActivo())) {
            if (request.getTotpCode() == null || request.getTotpCode().isBlank()) {

                return new LoginResponse(
                    "2FA_REQUIRED",
                    usuario.getIdUsuario(),
                    usuario.getNombres(),
                    usuario.getEmail(),
                    usuario.getRol().getIdRol(),
                    usuario.getRol().getNombreRol(),
                    usuario.getTotpActivo()
                );
            }

            if (!totpService.verifyCode(usuario.getTotpSecret(), request.getTotpCode())) {
                throw new RuntimeException("Código de autenticación inválido");
            }
        }

        String token = jwtService.generateToken(usuario.getEmail(), usuario.getRol().getNombreRol());

        return new LoginResponse(
                token,
                usuario.getIdUsuario(),
                usuario.getNombres(),
                usuario.getEmail(),
                usuario.getRol().getIdRol(),
                usuario.getRol().getNombreRol(),
                usuario.getTotpActivo()
        );
    }

    @Transactional
    public String requestPasswordReset(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No existe un usuario registrado con ese correo electrónico"));
        
        // Generar un código de 6 dígitos único
        String token = String.format("%06d", new Random().nextInt(999999));
        
        // Si ya existe un token para este usuario, lo actualizamos en lugar de intentar borrar/insertar
        // Esto evita errores de integridad (Unique Constraint) si el flush es lento
        PasswordResetToken resetToken = passwordResetTokenRepository.findByUsuario(usuario)
                .map(existingToken -> {
                    existingToken.setToken(token);
                    existingToken.setExpiryDate(java.time.LocalDateTime.now().plusHours(1));
                    return existingToken;
                })
                .orElse(new PasswordResetToken(token, usuario));
        
        passwordResetTokenRepository.save(resetToken);
        
        System.out.println(">>> [DEBUG] CÓDIGO DE RECUPERACIÓN PARA " + email + ": " + token);
        return token; // Se retorna para facilitar las pruebas sin servidor de correo
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Código de recuperación inválido o expirado"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("El código ha expirado. Por favor, solicita uno nuevo.");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
        
        // Eliminar el token usado
        passwordResetTokenRepository.delete(resetToken);
    }
    @Transactional
    public void disableTotp(Integer userId) {
        Usuario usuario = usuarioRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setTotpActivo(false);
        usuario.setTotpSecret(null);

        usuarioRepository.save(usuario);
    }

}
