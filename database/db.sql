CREATE DATABASE virtual_lab;
USE virtual_lab;


DROP TABLE RESERVEBYDEVICE;
DROP TABLE RESERVEG;
DROP TABLE PRACTICE;
DROP TABLE ADMINISTRATOR;
DROP TABLE SPECIFICDEVICE;
DROP TABLE GENERALDEVICE;
DROP TABLE GENERALTYPE;
<<<<<<< HEAD
DROP TABLE USER;
=======
DROP TABLE DEVICEBYPRACTICE;
DROP TABLE ENROLLMENT;
DROP TABLE COURSE;
DROP TABLE TEACHER;
>>>>>>> 43e9deff182614532bddcbe3cd62fe5468fb40b5


CREATE TABLE USER(
id INT(10) NOT NULL,
  fullname VARCHAR(50) NOT NULL,
  username VARCHAR(50)NOT NULL,
  role VARCHAR(50) NOT NULL,
  password VARCHAR(100)NOT NULL,
  PRIMARY KEY(id,role)
  );
<<<<<<< HEAD

  
  
=======
  CREATE TABLE STUDENT(
  id INT(10) PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50),
  password VARCHAR(50)
  );
>>>>>>> 43e9deff182614532bddcbe3cd62fe5468fb40b5

CREATE TABLE GENERALTYPE(
 id INT(4) NOT NULL AUTO_INCREMENT,
 name VARCHAR(50) NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE ADMINISTRATOR(
 username VARCHAR(50) PRIMARY KEY,
 password VARCHAR(100) NOT NULL
);

CREATE  TABLE GENERALDEVICE(
   id  INT(4) NOT NULL AUTO_INCREMENT,
   name VARCHAR(100) NOT NULL,
   type INT(4) NOT NULL,
   description TEXT NOT NULL,
   amount INT(4) NOT NULL,
   ports INT(3) NOT NULL,
   PRIMARY KEY(id),
    FOREIGN KEY (type) REFERENCES GENERALTYPE(id)
);
CREATE TABLE SPECIFICDEVICE(
id INT(4) AUTO_INCREMENT,
state VARCHAR(50) NOT NULL,
type INT(4) NOT NULL,
 FOREIGN KEY (type) REFERENCES GENERALDEVICE(id),
  PRIMARY KEY(id));

CREATE TABLE PRACTICE(
  id INT(10) PRIMARY KEY AUTO_INCREMENT,
   name VARCHAR(100) NOT NULL,
   description VARCHAR(400) NOT NULL,
   pods boolean not null
);

CREATE TABLE RESERVEG(
   id  INT(10)PRIMARY KEY AUTO_INCREMENT,
   id_practice INT(10) NOT NULL,
<<<<<<< HEAD
   course VARCHAR(20) NOT NULL,
   day DATE NOT NULL,
   startHour TIME NOT NULL,
   endHour TIME NOT NULL,
   podsAmount INT(2) NOT NULL,
   FOREIGN KEY (id_practice) REFERENCES PRACTICE(id));
=======
   course VARCHAR(35) NOT NULL,
   semester VARCHAR(6),
   groupC VARCHAR(2),
   day timestamp NOT NULL,
   startHour TIME NOT NULL,
   endHour TIME NOT NULL,
   podsAmount INT(2),
   FOREIGN KEY (course, semester, groupC) REFERENCES COURSE (name, semester, groupC) ON DELETE CASCADE,
   FOREIGN KEY (id_practice) REFERENCES PRACTICE(id) ON DELETE CASCADE);
>>>>>>> 43e9deff182614532bddcbe3cd62fe5468fb40b5

CREATE TABLE RESERVEBYDEVICE(
   reserve INT(10) NOT NULL,
   device INT(4) NOT NULL,
   FOREIGN KEY(device)REFERENCES SPECIFICDEVICE(id)  ON DELETE CASCADE,
   FOREIGN KEY(reserve) REFERENCES RESERVEG(id) ON DELETE CASCADE,
   PRIMARY KEY(reserve, device)
);

<<<<<<< HEAD
=======
CREATE TABLE DEVICEBYPRACTICE(
   practice INT(10),
   device INT(4),
   FOREIGN KEY(practice) REFERENCES PRACTICE(id) ON DELETE CASCADE,
   FOREIGN KEY(device) REFERENCES GENERALDEVICE(id) ON DELETE CASCADE,
   PRIMARY KEY(practice, device)
);

CREATE TABLE COURSE(
   name VARCHAR(35),
   semester VARCHAR(6),
   groupC VARCHAR(2),
   teacher_id INT(10),
   FOREIGN KEY(teacher_id) REFERENCES TEACHER(id),
   PRIMARY KEY(name, semester, groupC)
);

CREATE TABLE ENROLLMENT(
   student_id INT(10),
   semester VARCHAR(6) NOT NULL,
   course VARCHAR(35) NOT NULL,
   groupC VARCHAR(2) NOT NULL,
   FOREIGN KEY(course, semester, groupC) REFERENCES COURSE(name, semester, groupC),
   FOREIGN KEY(student_id) REFERENCES STUDENT(id),
   PRIMARY KEY(student_id, semester, course, groupC)
);

INSERT INTO TEACHER(name, password) VALUES('Andres Marin','1234');
INSERT INTO STUDENT(name, password) VALUES ('cualquiera', '123');
INSERT INTO COURSE(name, groupC, semester, teacher_id) VALUES('Comunicaciones y lab I', '1', '2020-1', '1');
INSERT INTO COURSE(name, groupC, semester, teacher_id) VALUES('Comunicaciones y lab II', '2', '2020-1', '1');
INSERT INTO ENROLLMENT(student_id, semester, course, groupC) VALUES('1', '2020-1', 'Comunicaciones y lab I', '1');
INSERT INTO ENROLLMENT(student_id, semester, course, groupC) VALUES('1', '2020-1', 'Comunicaciones y lab II', '2');

>>>>>>> 43e9deff182614532bddcbe3cd62fe5468fb40b5
INSERT INTO GENERALTYPE(name) VALUES ("SWL3");
INSERT INTO GENERALTYPE(name) VALUES ("SWL2");
INSERT INTO GENERALTYPE(name) VALUES ("ROUTER");
INSERT INTO GENERALTYPE(name) VALUES ("PC");

INSERT INTO GENERALDEVICE(id,name,type,description,amount,ports) VALUES (1,'Microtik',1,'Switche de nivel 3',10,20);
INSERT INTO GENERALDEVICE(id,name,type,description,amount,ports) VALUES (2,'Switch',2,'Switche de nivel 2',9,18);

INSERT INTO PRACTICE(name, description, pods) values('vlans', 'Uso de vlans', true);
INSERT INTO RESERVEG(id_practice, course, semester, groupC, day, startHour, endHour, podsAmount) values(1, 'Comunicaciones y lab I','2020-1', '1', '2020/10/25', 12-00-00, 02-00-00, 4);
INSERT INTO SPECIFICDEVICE(id, state, type)VALUES(1,'DISPONIBLE',1);
INSERT INTO RESERVEBYDEVICE(reserve, device)VALUES(1,1);
<<<<<<< HEAD
=======
INSERT INTO DEVICEBYPRACTICE(practice, device)VALUES(1,1);
>>>>>>> 43e9deff182614532bddcbe3cd62fe5468fb40b5
