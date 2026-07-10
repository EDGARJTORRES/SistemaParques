package com.sisParques;

import com.sisParques.entity.Usuario;
import com.sisParques.entity.Rol;
import com.sisParques.repository.UsuarioRepository;
import com.sisParques.repository.RolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class sisParquesApplication {

    public static void main(String[] args) {
        SpringApplication.run(sisParquesApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Inicializar Roles (solo si no existen)
            if (rolRepository.count() == 0) {
                rolRepository.save(new Rol(1, "administrador", "Super administrador del sistema"));
                rolRepository.save(new Rol(2, "subgerente", "Subgerente del Area"));
                rolRepository.save(new Rol(3, "supervisor", "Supervisor del Area"));
                rolRepository.save(new Rol(4, "obrero", "Obrero del Area"));
                System.out.println(">>> Roles inicializados correctamente");

            }   
        };
    }
}