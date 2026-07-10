package com.sisParques.service;

import com.sisParques.dto.UsuarioDTO;
import com.sisParques.entity.Rol;
import com.sisParques.entity.Usuario;
import com.sisParques.repository.RolRepository;
import com.sisParques.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioDTO> getAllUsers() {
        return usuarioRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UsuarioDTO getUserById(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return convertToDTO(usuario);
    }

    public UsuarioDTO getUserByEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return convertToDTO(usuario);
    }

    public UsuarioDTO createUser(UsuarioDTO dto) {
        if (usuarioRepository.existsByDni(dto.getDni())) {
            throw new RuntimeException("El DNI '" + dto.getDni() + "' ya se encuentra registrado");
        }
        Usuario usuario = new Usuario();
        mapDtoToEntity(dto, usuario);
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }
        Usuario savedUser = usuarioRepository.save(usuario);
        return convertToDTO(savedUser);
    }

    public UsuarioDTO updateUser(Integer id, UsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Verificar si el DNI ya está siendo usado por otro usuario
        usuarioRepository.findByDni(dto.getDni()).ifPresent(existingUser -> {
            if (!existingUser.getIdUsuario().equals(id)) {
                throw new RuntimeException("El DNI '" + dto.getDni() + "' ya está registrado por otro usuario");
            }
        });

        mapDtoToEntity(dto, usuario);
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }
        Usuario updatedUser = usuarioRepository.save(usuario);
        return convertToDTO(updatedUser);
    }

    public void deleteUser(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    public void changePassword(Integer id, String passwordActual, String passwordNueva) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(passwordActual, usuario.getPasswordHash())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        usuario.setPasswordHash(passwordEncoder.encode(passwordNueva));
        usuarioRepository.save(usuario);
    }

    private UsuarioDTO convertToDTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setIdUsuario(usuario.getIdUsuario());
        dto.setDni(usuario.getDni());
        dto.setNombres(usuario.getNombres());
        dto.setEmail(usuario.getEmail());
        dto.setActivo(usuario.getActivo());
        dto.setNmrCelular(usuario.getNmrCelular());
        if (usuario.getRol() != null) {
            dto.setIdRol(usuario.getRol().getIdRol());
            dto.setNombreRol(usuario.getRol().getNombreRol());
        }
        return dto;
    }

    private void mapDtoToEntity(UsuarioDTO dto, Usuario usuario) {
        usuario.setDni(dto.getDni());
        usuario.setNombres(dto.getNombres());
        usuario.setEmail(dto.getEmail());
        usuario.setActivo(dto.getActivo());
        usuario.setNmrCelular(dto.getNmrCelular());
        if (dto.getIdRol() != null) {
            Rol rol = rolRepository.findById(dto.getIdRol())
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
            usuario.setRol(rol);
        }
    }
    public List<UsuarioDTO> getUsersByRol(String nombreRol) {
        return usuarioRepository.findAll()
                .stream()
                .filter(u -> u.getRol() != null &&
                            u.getRol().getNombreRol().equalsIgnoreCase(nombreRol) &&
                            Boolean.TRUE.equals(u.getActivo()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

}
