package com.sisParques.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class MantenimientoDTO {

    private Integer       mantId;
    private String        mantTitulo;
    private LocalDate     mantFechaIni;
    private LocalDate     mantFechaFin;
    private String        mantObservacion;
    private Integer       persResponsable;
    private String        responsableNombre;
    private String        mantDoc;
    private LocalDateTime mantFechaCrea;
    private String        mantEstado;
    private Integer       parqId;
    private String        parqNombre;
    private Integer       persId;
    private String        persNombre;
    private String        mantFotoAntes;
    private String        mantFotoDespues;
    private Integer       idUsuario;
    private Integer[]     timaIds;
    private List<String>  timaNombres;
    private Integer       inciId;
    private String        inciTitulo;
    private List<Integer> obreroIds;
    private List<ObreroDTO> obreros;

    public Integer       getMantId()                        { return mantId; }
    public void          setMantId(Integer v)               { mantId = v; }
    public String        getMantTitulo()                    { return mantTitulo; }
    public void          setMantTitulo(String v)            { mantTitulo = v; }
    public LocalDate     getMantFechaIni()                  { return mantFechaIni; }
    public void          setMantFechaIni(LocalDate v)       { mantFechaIni = v; }
    public LocalDate     getMantFechaFin()                  { return mantFechaFin; }
    public void          setMantFechaFin(LocalDate v)       { mantFechaFin = v; }
    public String        getMantObservacion()               { return mantObservacion; }
    public void          setMantObservacion(String v)       { mantObservacion = v; }
    public Integer       getPersResponsable()               { return persResponsable; }
    public void          setPersResponsable(Integer v)      { persResponsable = v; }
    public String        getResponsableNombre()             { return responsableNombre; }
    public void          setResponsableNombre(String v)     { responsableNombre = v; }
    public String        getMantDoc()                       { return mantDoc; }
    public void          setMantDoc(String v)               { mantDoc = v; }
    public LocalDateTime getMantFechaCrea()                 { return mantFechaCrea; }
    public void          setMantFechaCrea(LocalDateTime v)  { mantFechaCrea = v; }
    public String        getMantEstado()                    { return mantEstado; }
    public void          setMantEstado(String v)            { mantEstado = v; }
    public Integer       getParqId()                        { return parqId; }
    public void          setParqId(Integer v)               { parqId = v; }
    public String        getParqNombre()                    { return parqNombre; }
    public void          setParqNombre(String v)            { parqNombre = v; }
    public Integer       getPersId()                        { return persId; }
    public void          setPersId(Integer v)               { persId = v; }
    public String        getPersNombre()                    { return persNombre; }
    public void          setPersNombre(String v)            { persNombre = v; }
    public String        getMantFotoAntes()                 { return mantFotoAntes; }
    public void          setMantFotoAntes(String v)         { mantFotoAntes = v; }
    public String        getMantFotoDespues()               { return mantFotoDespues; }
    public void          setMantFotoDespues(String v)       { mantFotoDespues = v; }
    public Integer       getIdUsuario()                     { return idUsuario; }
    public void          setIdUsuario(Integer v)            { idUsuario = v; }
    public Integer[]     getTimaIds()                       { return timaIds; }
    public void          setTimaIds(Integer[] v)            { timaIds = v; }
    public List<String>  getTimaNombres()                   { return timaNombres; }
    public void          setTimaNombres(List<String> v)     { timaNombres = v; }
    public Integer       getInciId()                        { return inciId; }
    public void          setInciId(Integer v)               { inciId = v; }
    public String        getInciTitulo()                    { return inciTitulo; }
    public void          setInciTitulo(String v)            { inciTitulo = v; }
    public List<Integer> getObreroIds()                     { return obreroIds; }
    public void          setObreroIds(List<Integer> v)      { obreroIds = v; }
    public List<ObreroDTO> getObreros()                     { return obreros; }
    public void          setObreros(List<ObreroDTO> v)      { obreros = v; }
}
