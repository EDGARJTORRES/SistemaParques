package com.sisParques.service;

import com.sisParques.dto.TipoMantenimientoDTO;
import com.sisParques.entity.TipoMantenimiento;
import com.sisParques.repository.TipoMantenimientoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TipoMantenimientoService {

    private final TipoMantenimientoRepository tipoMantenimientoRepository;

    public TipoMantenimientoService(TipoMantenimientoRepository tipoMantenimientoRepository) {
        this.tipoMantenimientoRepository = tipoMantenimientoRepository;
    }

    public List<TipoMantenimientoDTO> getAll() {
        return tipoMantenimientoRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TipoMantenimientoDTO getById(Integer id) {
        TipoMantenimiento tm = tipoMantenimientoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tipo de mantenimiento no encontrado con id: " + id));

        return toDTO(tm);
    }

    public TipoMantenimientoDTO create(TipoMantenimientoDTO dto) {

        if (tipoMantenimientoRepository.existsByTimaNombreIgnoreCase(dto.getTimaNombre())) {
            throw new RuntimeException(
                    "Ya existe un tipo de mantenimiento con el nombre '" + dto.getTimaNombre() + "'"
            );
        }

        TipoMantenimiento tm = new TipoMantenimiento();
        mapToEntity(dto, tm);

        if (tm.getTimaEstado() == null) {
            tm.setTimaEstado("A");
        }

        return toDTO(tipoMantenimientoRepository.save(tm));
    }

    public TipoMantenimientoDTO update(Integer id, TipoMantenimientoDTO dto) {

        TipoMantenimiento tm = tipoMantenimientoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tipo de mantenimiento no encontrado con id: " + id));

        tipoMantenimientoRepository.findAll().stream()
                .filter(existing ->
                        existing.getTimaNombre().equalsIgnoreCase(dto.getTimaNombre())
                                && !existing.getTimaId().equals(id))
                .findFirst()
                .ifPresent(dup -> {
                    throw new RuntimeException(
                            "Ya existe un tipo de mantenimiento con el nombre '" + dto.getTimaNombre() + "'"
                    );
                });

        mapToEntity(dto, tm);

        return toDTO(tipoMantenimientoRepository.save(tm));
    }

    public void delete(Integer id) {

        TipoMantenimiento tm = tipoMantenimientoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tipo de mantenimiento no encontrado con id: " + id));

        tm.setTimaEstado("I");

        tipoMantenimientoRepository.save(tm);
    }

    public TipoMantenimientoDTO reactivate(Integer id) {

        TipoMantenimiento tm = tipoMantenimientoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Tipo de mantenimiento no encontrado con id: " + id));

        tm.setTimaEstado("A");

        return toDTO(tipoMantenimientoRepository.save(tm));
    }

    // ==========================
    // Helpers
    // ==========================

    private TipoMantenimientoDTO toDTO(TipoMantenimiento tm) {

        TipoMantenimientoDTO dto = new TipoMantenimientoDTO();

        dto.setTimaId(tm.getTimaId());
        dto.setTimaNombre(tm.getTimaNombre());
        dto.setTimaDescrip(tm.getTimaDescrip());
        dto.setTimaFechaCrea(tm.getTimaFechaCrea());
        dto.setTimaEstado(tm.getTimaEstado());

        return dto;
    }

    private void mapToEntity(TipoMantenimientoDTO dto, TipoMantenimiento tm) {

        tm.setTimaNombre(dto.getTimaNombre());
        tm.setTimaDescrip(dto.getTimaDescrip());

        if (dto.getTimaEstado() != null) {
            tm.setTimaEstado(dto.getTimaEstado());
        }
    }
}