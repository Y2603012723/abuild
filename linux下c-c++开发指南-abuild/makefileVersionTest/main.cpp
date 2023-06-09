
#include "k1.h"
#include "k2.h"
#include "k3.h"
#include "version.h"
#include "y1.h"
#include "y2.h"
#include "y3.h"
#include <cstdio>
#include <iostream>

int main(int, char **) {
  std::cout << "Version " << TEMPLATE_BIN_VERSION_MAJOR << "."
            << TEMPLATE_BIN_VERSION_MINOR << "." << TEMPLATE_BIN_VERSION_PATCH
            << std::endl;
  std::cout << "Hello , world!\n";
  int a = 10;
  int b = 99;
  int c = 90;
  yyy1();
  yyy2();
  yyy3();
  k1();
  k2();
  k3();
  printf("%d\n", a + b + c);
}
