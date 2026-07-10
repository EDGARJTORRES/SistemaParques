package com.sisParques.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.sisParques.dto.CiudadanoDTO;
import com.sisParques.entity.Ciudadano;
import com.sisParques.repository.CiudadanoRepository;

@Service
public class CiudadanoService {

    private final CiudadanoRepository ciudadanoRepository;

    public CiudadanoService(CiudadanoRepository ciudadanoRepository) {
        this.ciudadanoRepository = ciudadanoRepository;
    }

    public List<CiudadanoDTO> getAll() {
        return ciudadanoRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CiudadanoDTO getById(Integer id) {
        Ciudadano c = ciudadanoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ciudadano no encontrado con id: " + id));
        return toDTO(c);
    }

    public CiudadanoDTO create(CiudadanoDTO dto) {
        if (ciudadanoRepository.existsByCiudNumeroDocumento(dto.getCiudNumeroDocumento())) {
            throw new RuntimeException("Ya existe un ciudadano registrado con el documento '" + dto.getCiudNumeroDocumento() + "'");
        }
        Ciudadano c = new Ciudadano();
        mapToEntity(dto, c);
        if (c.getCiudEstado() == null) c.setCiudEstado("A");
        return toDTO(ciudadanoRepository.save(c));
    }

    public CiudadanoDTO update(Integer id, CiudadanoDTO dto) {
        Ciudadano c = ciudadanoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ciudadano no encontrado con id: " + id));

        ciudadanoRepository.findByCiudNumeroDocumento(dto.getCiudNumeroDocumento())
                .filter(existing -> !existing.getCiudId().equals(id))
                .ifPresent(dup -> {
                    throw new RuntimeException("Ya existe un ciudadano con el documento '" + dto.getCiudNumeroDocumento() + "'");
                });

        mapToEntity(dto, c);
        return toDTO(ciudadanoRepository.save(c));
    }

    public void delete(Integer id) {
        Ciudadano c = ciudadanoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ciudadano no encontrado con id: " + id));
        c.setCiudEstado("I");
        ciudadanoRepository.save(c);
    }

    public CiudadanoDTO reactivate(Integer id) {
        Ciudadano c = ciudadanoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ciudadano no encontrado con id: " + id));
        c.setCiudEstado("A");
        return toDTO(ciudadanoRepository.save(c));
    }

    // ── helpers usados también por IncidenciaService ───────────────────────

    protected Ciudadano findOrCreateEntity(CiudadanoDTO dto) {
        return ciudadanoRepository.findByCiudNumeroDocumento(dto.getCiudNumeroDocumento())
                .orElseGet(() -> {
                    Ciudadano nuevo = new Ciudadano();
                    mapToEntity(dto, nuevo);
                    if (nuevo.getCiudEstado() == null) nuevo.setCiudEstado("A");
                    return ciudadanoRepository.save(nuevo);
                });
    }

    // ── helpers ──────────────────────────────────────────────────────────

    protected CiudadanoDTO toDTO(Ciudadano c) {
        CiudadanoDTO dto = new CiudadanoDTO();
        dto.setCiudId(c.getCiudId());
        dto.setCiudNombres(c.getCiudNombres());
        dto.setCiudApellidos(c.getCiudApellidos());
        dto.setCiudTipoDocumento(c.getCiudTipoDocumento());
        dto.setCiudNumeroDocumento(c.getCiudNumeroDocumento());
        dto.setCiudTelefono(c.getCiudTelefono());
        dto.setCiudEmail(c.getCiudEmail());
        dto.setCiudDireccion(c.getCiudDireccion());
        dto.setCiudEstado(c.getCiudEstado());
        dto.setCiudFechaRegistro(c.getCiudFechaRegistro());
        return dto;
    }

    private void mapToEntity(CiudadanoDTO dto, Ciudadano c) {
        c.setCiudNombres(dto.getCiudNombres());
        c.setCiudApellidos(dto.getCiudApellidos());
        c.setCiudTipoDocumento(dto.getCiudTipoDocumento());
        c.setCiudNumeroDocumento(dto.getCiudNumeroDocumento());
        c.setCiudTelefono(dto.getCiudTelefono());
        c.setCiudEmail(dto.getCiudEmail());
        c.setCiudDireccion(dto.getCiudDireccion());
        if (dto.getCiudEstado() != null) c.setCiudEstado(dto.getCiudEstado());
    }
}