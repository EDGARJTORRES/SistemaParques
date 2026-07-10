package com.sisParques.service;

import com.sisParques.dto.ParqueDTO;
import com.sisParques.entity.Parque;
import com.sisParques.repository.ParqueRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParqueService {

    private final ParqueRepository parqueRepository;

    public ParqueService(ParqueRepository parqueRepository) {
        this.parqueRepository = parqueRepository;
    }

    public List<ParqueDTO> getAll() {
        return parqueRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ParqueDTO getById(Integer id) {
        Parque p = parqueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parque no encontrado con id: " + id));
        return toDTO(p);
    }

    public ParqueDTO create(ParqueDTO dto) {
        if (parqueRepository.existsByParqNombreIgnoreCase(dto.getParqNombre())) {
            throw new RuntimeException("Ya existe un parque registrado con el nombre '" + dto.getParqNombre() + "'");
        }
        Parque p = new Parque();
        mapToEntity(dto, p);
        if (p.getParqEstado() == null) p.setParqEstado("A");
        return toDTO(parqueRepository.save(p));
    }

    public ParqueDTO update(Integer id, ParqueDTO dto) {
        Parque p = parqueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parque no encontrado con id: " + id));

        parqueRepository.findAll().stream()
                .filter(existing -> existing.getParqNombre().equalsIgnoreCase(dto.getParqNombre())
                        && !existing.getParqId().equals(id))
                .findFirst()
                .ifPresent(dup -> {
                    throw new RuntimeException("Ya existe un parque con el nombre '" + dto.getParqNombre() + "'");
                });

        mapToEntity(dto, p);
        return toDTO(parqueRepository.save(p));
    }

    public void delete(Integer id) {
        Parque p = parqueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parque no encontrado con id: " + id));
        p.setParqEstado("I");
        parqueRepository.save(p);
    }

    public ParqueDTO reactivate(Integer id) {
        Parque p = parqueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parque no encontrado con id: " + id));
        p.setParqEstado("A");
        return toDTO(parqueRepository.save(p));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ParqueDTO toDTO(Parque p) {
        ParqueDTO dto = new ParqueDTO();
        dto.setParqId(p.getParqId());
        dto.setParqNombre(p.getParqNombre());
        dto.setParqDireccion(p.getParqDireccion());
        dto.setParqCoordenadas(p.getParqCoordenadas());
        dto.setParqFechaCrea(p.getParqFechaCrea());
        dto.setParqEstado(p.getParqEstado());
        return dto;
    }

    private void mapToEntity(ParqueDTO dto, Parque p) {
        p.setParqNombre(dto.getParqNombre());
        p.setParqDireccion(dto.getParqDireccion());
        p.setParqCoordenadas(dto.getParqCoordenadas());
        if (dto.getParqEstado() != null) p.setParqEstado(dto.getParqEstado());
    }
}
