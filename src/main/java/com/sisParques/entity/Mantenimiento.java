package com.sisParques.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_mantenimiento", schema = "sc_sistema")
public class Mantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mant_id")
    private Integer mantId;

    @Column(name = "mant_titulo", length = 100)
    private String mantTitulo;

    @Column(name = "mant_fecha_ini")
    private LocalDate mantFechaIni;

    @Column(name = "mant_fecha_fin")
    private LocalDate mantFechaFin;

    @Column(name = "mant_observacion", columnDefinition = "TEXT")
    private String mantObservacion;

    @Column(name = "pers_responsable")
    private Integer persResponsable;

    @Column(name = "mant_doc", columnDefinition = "TEXT")
    private String mantDoc;

    @Column(name = "mant_fecha_crea", updatable = false)
    private LocalDateTime mantFechaCrea;

    @Column(name = "mant_estado", length = 20)
    private String mantEstado;

    @Column(name = "parq_id")
    private Integer parqId;

    @Column(name = "pers_id")
    private Integer persId;

    @Column(name = "mant_foto_antes", length = 255)
    private String mantFotoAntes;

    @Column(name = "mant_foto_despues", length = 255)
    private String mantFotoDespues;

    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "tima_ids", columnDefinition = "integer[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private Integer[] timaIds;

    @Column(name = "inci_id")
    private Integer inciId;

    @PrePersist
    protected void onCreate() {
        if (mantFechaCrea == null) mantFechaCrea = LocalDateTime.now();
        if (mantEstado    == null) mantEstado    = "PENDIENTE";
    }

    public Integer getMantId()                        { return mantId; }
    public void    setMantId(Integer v)               { this.mantId = v; }
    public String  getMantTitulo()                    { return mantTitulo; }
    public void    setMantTitulo(String v)            { this.mantTitulo = v; }
    public LocalDate getMantFechaIni()                { return mantFechaIni; }
    public void    setMantFechaIni(LocalDate v)       { this.mantFechaIni = v; }
    public LocalDate getMantFechaFin()                { return mantFechaFin; }
    public void    setMantFechaFin(LocalDate v)       { this.mantFechaFin = v; }
    public String  getMantObservacion()               { return mantObservacion; }
    public void    setMantObservacion(String v)       { this.mantObservacion = v; }
    public Integer getPersResponsable()               { return persResponsable; }
    public void    setPersResponsable(Integer v)      { this.persResponsable = v; }
    public String  getMantDoc()                       { return mantDoc; }
    public void    setMantDoc(String v)               { this.mantDoc = v; }
    public LocalDateTime getMantFechaCrea()           { return mantFechaCrea; }
    public void    setMantFechaCrea(LocalDateTime v)  { this.mantFechaCrea = v; }
    public String  getMantEstado()                    { return mantEstado; }
    public void    setMantEstado(String v)            { this.mantEstado = v; }
    public Integer getParqId()                        { return parqId; }
    public void    setParqId(Integer v)               { this.parqId = v; }
    public Integer getPersId()                        { return persId; }
    public void    setPersId(Integer v)               { this.persId = v; }
    public String  getMantFotoAntes()                 { return mantFotoAntes; }
    public void    setMantFotoAntes(String v)         { this.mantFotoAntes = v; }
    public String  getMantFotoDespues()               { return mantFotoDespues; }
    public void    setMantFotoDespues(String v)       { this.mantFotoDespues = v; }
    public Integer getIdUsuario()                     { return idUsuario; }
    public void    setIdUsuario(Integer v)            { this.idUsuario = v; }
    public Integer[] getTimaIds()                     { return timaIds; }
    public void    setTimaIds(Integer[] v)            { this.timaIds = v; }
    public Integer getInciId()                        { return inciId; }
    public void    setInciId(Integer v)               { this.inciId = v; }
}
