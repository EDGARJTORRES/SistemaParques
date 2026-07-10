package com.sisParques.controller;

import com.sisParques.dto.TotpSetupResponse;
import com.sisParques.dto.TotpVerifyRequest;
import com.sisParques.entity.Usuario;
import com.sisParques.repository.UsuarioRepository;
import com.sisParques.service.TotpService;
import dev.samstevens.totp.exceptions.QrGenerationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/2fa")
@CrossOrigin(origins = "http://localhost:3000")
public class TotpController {

    private final TotpService totpService;
    private final UsuarioRepository usuarioRepository;

    public TotpController(TotpService totpService, UsuarioRepository usuarioRepository) {
        this.totpService = totpService;
        this.usuarioRepository = usuarioRepository;
    }

    // Paso 1: Generar secret + QR para el usuario
    @PostMapping("/setup/{idUsuario}")
    public ResponseEntity<?> setup(@PathVariable Integer idUsuario) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String secret = totpService.generateSecret();
            usuario.setTotpSecret(secret);
            usuario.setTotpActivo(false); // aún no confirmado
            usuarioRepository.save(usuario);

            String qrUri = totpService.generateQrDataUri(secret, usuario.getEmail());
            return ResponseEntity.ok(new TotpSetupResponse(secret, qrUri));
        } catch (QrGenerationException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error generando QR: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error interno: " + e.getMessage()));
        }
    }

    // Paso 2: Verificar código OTP y activar 2FA
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody TotpVerifyRequest request) {
        try {
            Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (totpService.verifyCode(usuario.getTotpSecret(), request.getCode())) {
                usuario.setTotpActivo(true);
                usuarioRepository.save(usuario);
                return ResponseEntity.ok(Map.of("message", "2FA activado correctamente"));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Código inválido. Intenta nuevamente."));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error interno: " + e.getMessage()));
        }
    }

    // Desactivar 2FA
    @PostMapping("/disable/{idUsuario}")
    public ResponseEntity<?> disable(@PathVariable Integer idUsuario) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            usuario.setTotpActivo(false);
            usuario.setTotpSecret(null);
            usuarioRepository.save(usuario);
            return ResponseEntity.ok(Map.of("message", "2FA desactivado"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error interno: " + e.getMessage()));
        }
    }

    // Consultar estado 2FA del usuario
    @GetMapping("/status/{idUsuario}")
    public ResponseEntity<?> status(@PathVariable Integer idUsuario) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            return ResponseEntity.ok(Map.of("totpActivo", usuario.getTotpActivo()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error interno: " + e.getMessage()));
        }
    }
}