
var typed = new Typed(".text", {
    strings: [
        "Computer Science Student",
        "Python Developer",
        "DevOps Enthusiast",
        "Machine Learning Enthusiast",
        "Frontend Developer"
    ],
    typeSpeed: 100,
    backSpeed: 80,
    backDelay: 1500,
    loop: true
});

/* CUSTOM CURSOR */

const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
});
