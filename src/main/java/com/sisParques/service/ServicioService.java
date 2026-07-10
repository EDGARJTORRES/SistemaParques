package com.sisParques.service;

import com.sisParques.dto.ServicioDTO;
import com.sisParques.entity.Servicio;
import com.sisParques.repository.ServicioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    public List<ServicioDTO> getAll() {
        return servicioRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ServicioDTO getById(Integer id) {
        Servicio s = servicioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado con id: " + id));
        return toDTO(s);
    }

    public ServicioDTO create(ServicioDTO dto) {
        if (servicioRepository.existsByServNombreIgnoreCase(dto.getServNombre())) {
            throw new RuntimeException("Ya existe un servicio con el nombre '" + dto.getServNombre() + "'");
        }
        Servicio s = new Servicio();
        mapToEntity(dto, s);
        if (s.getServEstado() == null) s.setServEstado("A");
        return toDTO(servicioRepository.save(s));
    }

    public ServicioDTO update(Integer id, ServicioDTO dto) {
        Servicio s = servicioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado con id: " + id));

        // Verificar nombre duplicado en otro registro
        servicioRepository.findAll().stream()
                .filter(existing -> existing.getServNombre().equalsIgnoreCase(dto.getServNombre())
                        && !existing.getServId().equals(id))
                .findFirst()
                .ifPresent(dup -> {
                    throw new RuntimeException("Ya existe un servicio con el nombre '" + dto.getServNombre() + "'");
                });

        mapToEntity(dto, s);
        return toDTO(servicioRepository.save(s));
    }

    public void delete(Integer id) {
        Servicio s = servicioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado con id: " + id));
        s.setServEstado("I");
        servicioRepository.save(s);
    }

    public ServicioDTO reactivate(Integer id) {
        Servicio s = servicioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado con id: " + id));
        s.setServEstado("A");
        return toDTO(servicioRepository.save(s));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ServicioDTO toDTO(Servicio s) {
        ServicioDTO dto = new ServicioDTO();
        dto.setServId(s.getServId());
        dto.setServNombre(s.getServNombre());
        dto.setServDescripcion(s.getServDescripcion());
        dto.setServFechaCrea(s.getServFechaCrea());
        dto.setServEstado(s.getServEstado());
        return dto;
    }

    private void mapToEntity(ServicioDTO dto, Servicio s) {
        s.setServNombre(dto.getServNombre());
        s.setServDescripcion(dto.getServDescripcion());
        if (dto.getServEstado() != null) s.setServEstado(dto.getServEstado());
    }
}
