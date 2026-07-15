package com.sisParques.dto;

public class BienDTO {
    private Long   bienId;
    private Long   bienDepeId;
    private String objNombre;
    private String bienNumSerie;
    private String bienPlaca;
    private String bienColor;
    private String bienObs;
    private String bienEst;

    // Getters & Setters
    public Long   getBienId()                  { return bienId; }
    public void   setBienId(Long v)            { this.bienId = v; }

    public Long   getBienDepeId()              { return bienDepeId; }
    public void   setBienDepeId(Long v)        { this.bienDepeId = v; }

    public String getObjNombre()               { return objNombre; }
    public void   setObjNombre(String v)       { this.objNombre = v; }

    public String getBienNumSerie()            { return bienNumSerie; }
    public void   setBienNumSerie(String v)    { this.bienNumSerie = v; }

    public String getBienPlaca()               { return bienPlaca; }
    public void   setBienPlaca(String v)       { this.bienPlaca = v; }

    public String getBienColor()               { return bienColor; }
    public void   setBienColor(String v)       { this.bienColor = v; }

    public String getBienObs()                 { return bienObs; }
    public void   setBienObs(String v)         { this.bienObs = v; }

    public String getBienEst()                 { return bienEst; }
    public void   setBienEst(String v)         { this.bienEst = v; }
}
