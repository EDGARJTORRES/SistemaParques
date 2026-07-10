package com.sisParques.service;
import com.sisParques.dto.ParqueServicioDTO;
import com.sisParques.entity.Parque;
import com.sisParques.entity.ParqueServicio;
import com.sisParques.entity.Servicio;
import com.sisParques.repository.ParqueRepository;
import com.sisParques.repository.ParqueServicioRepository;
import com.sisParques.repository.ServicioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParqueServicioService { 

    private final ParqueServicioRepository parqueServicioRepository;
    private final ParqueRepository parqueRepository;
    private final ServicioRepository servicioRepository;

    public ParqueServicioService(
            ParqueServicioRepository parqueServicioRepository,
            ParqueRepository parqueRepository,
            ServicioRepository servicioRepository
    ) {
        this.parqueServicioRepository = parqueServicioRepository;
        this.parqueRepository = parqueRepository;
        this.servicioRepository = servicioRepository;
    }

    public List<ParqueServicioDTO> getAll() {
        return parqueServicioRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ParqueServicioDTO> getByParque(Integer parqId) {
        return parqueServicioRepository
                .findByParqueParqIdAndPaseEstado(parqId, "A")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ParqueServicioDTO create(ParqueServicioDTO dto) {

        if (parqueServicioRepository.existsByParqueParqIdAndServicioServId(
                dto.getParqId(),
                dto.getServId())) {

            throw new RuntimeException(
                    "El servicio ya está asignado a este parque"
            );
        }

        Parque parque = parqueRepository.findById(dto.getParqId())
                .orElseThrow(() ->
                        new RuntimeException("Parque no encontrado"));

        Servicio servicio = servicioRepository.findById(dto.getServId())
                .orElseThrow(() ->
                        new RuntimeException("Servicio no encontrado"));

        ParqueServicio entidad = new ParqueServicio();
        entidad.setParque(parque);
        entidad.setServicio(servicio);
        entidad.setPaseEstado("A");

        return toDTO(parqueServicioRepository.save(entidad));
    }

    public void delete(Integer paseId) {

        ParqueServicio entidad = parqueServicioRepository.findById(paseId)
                .orElseThrow(() ->
                        new RuntimeException("Relación no encontrada"));

        entidad.setPaseEstado("I");

        parqueServicioRepository.save(entidad);
    }

    public ParqueServicioDTO reactivate(Integer paseId) {

        ParqueServicio entidad = parqueServicioRepository.findById(paseId)
                .orElseThrow(() ->
                        new RuntimeException("Relación no encontrada"));

        entidad.setPaseEstado("A");

        return toDTO(parqueServicioRepository.save(entidad));
    }

    private ParqueServicioDTO toDTO(ParqueServicio entidad) {

        ParqueServicioDTO dto = new ParqueServicioDTO();

        dto.setPaseId(entidad.getPaseId());

        dto.setParqId(
                entidad.getParque() != null
                        ? entidad.getParque().getParqId()
                        : null
        );

        dto.setParqNombre(
                entidad.getParque() != null
                        ? entidad.getParque().getParqNombre()
                        : null
        );

        dto.setServId(
                entidad.getServicio() != null
                        ? entidad.getServicio().getServId()
                        : null
        );

        dto.setServNombre(
                entidad.getServicio() != null
                        ? entidad.getServicio().getServNombre()
                        : null
        );

        dto.setPaseEstado(entidad.getPaseEstado());

        return dto;
    }
}