#include <iostream>
#include "version.h"

using namespace std;

int main() {
  // 在这里编写你的 C++ 代码
  std::cout << "Version " << TEMPLATE_BIN_VERSION_MAJOR << "."
            << TEMPLATE_BIN_VERSION_MINOR << "." << TEMPLATE_BIN_VERSION_PATCH
            << std::endl;
  cout << "ABuild, Hello, World!" << endl;
  return 0;
}