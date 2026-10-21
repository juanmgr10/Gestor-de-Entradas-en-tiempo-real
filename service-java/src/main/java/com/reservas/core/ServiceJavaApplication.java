package com.reservas.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServiceJavaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceJavaApplication.class, args);
    }
}
