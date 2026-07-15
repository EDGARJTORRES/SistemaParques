package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_asignacion", schema = "sc_sistema")
public class Asignacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asig_id")
    private Long asigId;

    /** obr_id de tb_obrero (el obrero asignado) */
    @Column(name = "obr_id", nullable = false)
    private Long obrId;

    @Column(name = "asig_fecha", updatable = false)
    private LocalDateTime asigFecha;

    @Column(name = "asig_observacion", columnDefinition = "TEXT")
    private String asigObservacion;

    @Column(name = "asig_estado", length = 20)
    private String asigEstado;

    @Column(name = "id_usuario")
    private Integer idUsuario;

    @OneToMany(mappedBy = "asignacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AsignacionDetalle> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (asigFecha  == null) asigFecha  = LocalDateTime.now();
        if (asigEstado == null) asigEstado = "ACTIVO";
    }

    public Long   getAsigId()                              { return asigId; }
    public void   setAsigId(Long asigId)                   { this.asigId = asigId; }

    public Long   getObrId()                               { return obrId; }
    public void   setObrId(Long obrId)                     { this.obrId = obrId; }

    public LocalDateTime getAsigFecha()                    { return asigFecha; }
    public void   setAsigFecha(LocalDateTime v)            { this.asigFecha = v; }

    public String getAsigObservacion()                     { return asigObservacion; }
    public void   setAsigObservacion(String v)             { this.asigObservacion = v; }

    public String getAsigEstado()                          { return asigEstado; }
    public void   setAsigEstado(String v)                  { this.asigEstado = v; }

    public Integer getIdUsuario()                          { return idUsuario; }
    public void   setIdUsuario(Integer v)                  { this.idUsuario = v; }

    public List<AsignacionDetalle> getDetalles()           { return detalles; }
    public void setDetalles(List<AsignacionDetalle> v)     { this.detalles = v; }
}
