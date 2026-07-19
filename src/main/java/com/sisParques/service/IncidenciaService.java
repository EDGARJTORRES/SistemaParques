package com.sisParques.service;

import com.sisParques.dto.CiudadanoDTO;
import com.sisParques.dto.IncidenciaDTO;
import com.sisParques.entity.Ciudadano;
import com.sisParques.entity.Incidencia;
import com.sisParques.repository.CiudadanoRepository;
import com.sisParques.repository.IncidenciaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de incidencias reportadas por ciudadanos.
 * Permite registrar, consultar, actualizar y cambiar el estado de incidencias.
 * Soporta el registro de incidencias con ciudadanos existentes o la creación automática
 * de nuevos ciudadanos.
 */
@Service
public class IncidenciaService {

    private final IncidenciaRepository incidenciaRepository;
    private final CiudadanoRepository ciudadanoRepository;
    private final CiudadanoService ciudadanoService;

    public IncidenciaService(IncidenciaRepository incidenciaRepository,
                              CiudadanoRepository ciudadanoRepository,
                              CiudadanoService ciudadanoService) {
        this.incidenciaRepository = incidenciaRepository;
        this.ciudadanoRepository = ciudadanoRepository;
        this.ciudadanoService = ciudadanoService;
    }

    /** Obtiene la lista completa de todas las incidencias */
    public List<IncidenciaDTO> getAll() {
        return incidenciaRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /** Obtiene una incidencia específica por su ID */
    public IncidenciaDTO getById(Integer id) {
        Incidencia i = incidenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con id: " + id));
        return toDTO(i);
    }

    /** Obtiene todas las incidencias reportadas por un ciudadano específico */
    public List<IncidenciaDTO> getByCiudadano(Integer ciudId) {
        return incidenciaRepository.findByCiudadanoCiudId(ciudId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /** Obtiene todas las incidencias filtradas por su estado */
    public List<IncidenciaDTO> getByEstado(String estado) {
        return incidenciaRepository.findByInciEstado(estado)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Registra una incidencia usando un ciudadano ya existente (por ciudId).
     */
    public IncidenciaDTO create(IncidenciaDTO dto) {
        if (dto.getCiudId() == null) {
            throw new RuntimeException("Debe indicar el ciudadano (ciudId) para registrar la incidencia");
        }
        Ciudadano ciudadano = ciudadanoRepository.findById(dto.getCiudId())
                .orElseThrow(() -> new RuntimeException("Ciudadano no encontrado con id: " + dto.getCiudId()));

        Incidencia i = new Incidencia();
        mapToEntity(dto, i);
        i.setCiudadano(ciudadano);
        return toDTO(incidenciaRepository.save(i));
    }

    /**
     * Registra una incidencia junto con los datos del ciudadano.
     * Si el ciudadano ya existe (por número de documento), lo reutiliza;
     * si no existe, lo crea automáticamente.
     */
    public IncidenciaDTO registrar(IncidenciaDTO incidenciaDto, CiudadanoDTO ciudadanoDto) {
        if (ciudadanoDto.getCiudNumeroDocumento() == null || ciudadanoDto.getCiudNumeroDocumento().isBlank()) {
            throw new RuntimeException("El número de documento del ciudadano es obligatorio");
        }

        Ciudadano ciudadano = ciudadanoService.findOrCreateEntity(ciudadanoDto);

        Incidencia i = new Incidencia();
        mapToEntity(incidenciaDto, i);
        i.setCiudadano(ciudadano);

        return toDTO(incidenciaRepository.save(i));
    }

    /** Actualiza una incidencia existente, permitiendo cambiar el ciudadano asociado */
    public IncidenciaDTO update(Integer id, IncidenciaDTO dto) {
        Incidencia i = incidenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con id: " + id));

        mapToEntity(dto, i);

        if (dto.getCiudId() != null && !dto.getCiudId().equals(i.getCiudadano().getCiudId())) {
            Ciudadano nuevoCiudadano = ciudadanoRepository.findById(dto.getCiudId())
                    .orElseThrow(() -> new RuntimeException("Ciudadano no encontrado con id: " + dto.getCiudId()));
            i.setCiudadano(nuevoCiudadano);
        }

        return toDTO(incidenciaRepository.save(i));
    }

    /** Cambia el estado de una incidencia (ej: PENDIENTE, EN_PROCESO, RESUELTO) */
    public IncidenciaDTO cambiarEstado(Integer id, String nuevoEstado) {
        Incidencia i = incidenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con id: " + id));
        i.setInciEstado(nuevoEstado);
        return toDTO(incidenciaRepository.save(i));
    }

    /** Elimina lógicamente una incidencia cambiando su estado a CANCELADO */
    public void delete(Integer id) {
        Incidencia i = incidenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada con id: " + id));
        i.setInciEstado("CANCELADO");
        incidenciaRepository.save(i);
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private IncidenciaDTO toDTO(Incidencia i) {
        IncidenciaDTO dto = new IncidenciaDTO();
        dto.setInciId(i.getInciId());
        dto.setCiudId(i.getCiudadano() != null ? i.getCiudadano().getCiudId() : null);
        if (i.getCiudadano() != null) {
            dto.setCiudNombreCompleto(i.getCiudadano().getCiudNombres() + " " + i.getCiudadano().getCiudApellidos());
        }
        dto.setInciTitulo(i.getInciTitulo());
        dto.setInciDescripcion(i.getInciDescripcion());
        dto.setInciDireccion(i.getInciDireccion());
        dto.setInciReferencia(i.getInciReferencia());
        dto.setInciEstado(i.getInciEstado());
        dto.setInciPrioridad(i.getInciPrioridad());
        dto.setInciObservacion(i.getInciObservacion());
        dto.setInciFechCrea(i.getInciFechCrea());
        dto.setIdUsuario(i.getIdUsuario());
        return dto;
    }

    private void mapToEntity(IncidenciaDTO dto, Incidencia i) {
        i.setInciTitulo(dto.getInciTitulo());
        i.setInciDescripcion(dto.getInciDescripcion());
        i.setInciDireccion(dto.getInciDireccion());
        i.setInciReferencia(dto.getInciReferencia());
        if (dto.getInciEstado() != null) i.setInciEstado(dto.getInciEstado());
        i.setInciPrioridad(dto.getInciPrioridad());
        i.setInciObservacion(dto.getInciObservacion());
        i.setIdUsuario(dto.getIdUsuario());
    }
}