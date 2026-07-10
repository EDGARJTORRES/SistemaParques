package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_incidencia", schema = "sc_sistema")
public class Incidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inci_id")
    private Integer inciId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ciud_id", nullable = false)
    private Ciudadano ciudadano;

    @Column(name = "inci_titulo", length = 150, nullable = false)
    private String inciTitulo;

    @Column(name = "inci_descripcion", columnDefinition = "TEXT")
    private String inciDescripcion;

    @Column(name = "inci_direccion", columnDefinition = "TEXT")
    private String inciDireccion;

    @Column(name = "inci_referencia", columnDefinition = "TEXT")
    private String inciReferencia;

    @Column(name = "inci_estado", length = 20)
    private String inciEstado;

    @Column(name = "inci_prioridad", length = 20)
    private String inciPrioridad;

    @Column(name = "inci_observacion", columnDefinition = "TEXT")
    private String inciObservacion;

    @Column(name = "inci_fech_crea", updatable = false)
    private LocalDateTime inciFechCrea;

    @Column(name = "id_usuario")
    private Integer idUsuario;

    @PrePersist
    protected void onCreate() {
        if (inciFechCrea == null) {
            inciFechCrea = LocalDateTime.now();
        }

        if (inciEstado == null) {
            inciEstado = "PENDIENTE";
        }
    }

    // Getters & Setters

    public Integer getInciId() {
        return inciId;
    }

    public void setInciId(Integer inciId) {
        this.inciId = inciId;
    }

    public Ciudadano getCiudadano() {
        return ciudadano;
    }

    public void setCiudadano(Ciudadano ciudadano) {
        this.ciudadano = ciudadano;
    }

    public String getInciTitulo() {
        return inciTitulo;
    }

    public void setInciTitulo(String inciTitulo) {
        this.inciTitulo = inciTitulo;
    }

    public String getInciDescripcion() {
        return inciDescripcion;
    }

    public void setInciDescripcion(String inciDescripcion) {
        this.inciDescripcion = inciDescripcion;
    }

    public String getInciDireccion() {
        return inciDireccion;
    }

    public void setInciDireccion(String inciDireccion) {
        this.inciDireccion = inciDireccion;
    }

    public String getInciReferencia() {
        return inciReferencia;
    }

    public void setInciReferencia(String inciReferencia) {
        this.inciReferencia = inciReferencia;
    }

    public String getInciEstado() {
        return inciEstado;
    }

    public void setInciEstado(String inciEstado) {
        this.inciEstado = inciEstado;
    }

    public String getInciPrioridad() {
        return inciPrioridad;
    }

    public void setInciPrioridad(String inciPrioridad) {
        this.inciPrioridad = inciPrioridad;
    }

    public String getInciObservacion() {
        return inciObservacion;
    }

    public void setInciObservacion(String inciObservacion) {
        this.inciObservacion = inciObservacion;
    }

    public LocalDateTime getInciFechCrea() {
        return inciFechCrea;
    }

    public void setInciFechCrea(LocalDateTime inciFechCrea) {
        this.inciFechCrea = inciFechCrea;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }
}